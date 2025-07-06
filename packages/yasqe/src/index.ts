import "./scss/yasqe.scss";
import "./scss/buttons.scss";
import { EventEmitter } from "events";
import { findFirstPrefixLine } from "./prefixFold";
import { getPrefixesFromQuery, addPrefixes, removePrefixes, Prefixes } from "./prefixUtils";
import { getPreviousNonWsToken, getNextNonWsToken } from "./tokenUtils";
import * as sparql11Mode from "../grammar/tokenizer";
import { Storage as YStorage } from "@zazuko/yasgui-utils";
import * as queryString from "query-string";
import { drawSvgStringAsElement, addClass, removeClass } from "@zazuko/yasgui-utils";
import * as Sparql from "./sparql";
import * as imgs from "./imgs";
import { merge } from "lodash-es";
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper";
import * as monaco from "monaco-editor";
import { buildWrapperConfig } from "./editor/config";

import getDefaults from "./defaults";
import { YasqeAjaxConfig } from "./sparql";
import { EndpointMetadata } from "./editor/endpointMetadata";
// import tooltip from "./tooltip";

class LspInfoOverlayWidget implements monaco.editor.IOverlayWidget {
  private domNode: HTMLElement;

  constructor(private readonly editor: monaco.editor.IStandaloneCodeEditor, backend: any) {
    this.domNode = document.createElement("div");
    this.domNode.style.background = "#444";
    this.domNode.style.color = "#fff";
    this.domNode.style.padding = "0.3em 0.5em";
    this.domNode.style.fontSize = "12px";
    this.domNode.style.borderRadius = "4px";
    this.domNode.style.cursor = "pointer";
    this.domNode.addEventListener("mouseover", () => {
      this.domNode.style.filter = "brightness(60%)";
    });
    this.domNode.addEventListener("mouseout", () => {
      this.domNode.style.filter = "";
    });
    this.domNode.innerText = "ℹ️ Backends Info";
    this.domNode.onclick = () => {
      // const info = getLanguageServerState();
      alert(JSON.stringify(backend, null, 2));
    };
  }
  getId(): string {
    return "lsp.info.overlay";
  }
  getDomNode(): HTMLElement {
    return this.domNode;
  }
  getPosition(): monaco.editor.IOverlayWidgetPosition {
    return {
      preference: monaco.editor.OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER,
    };
  }
}

export interface Yasqe {
  on(eventName: "query", handler: (instance: Yasqe, req: Request, abortController?: AbortController) => void): this;
  off(eventName: "query", handler: (instance: Yasqe, req: Request, abortController?: AbortController) => void): this;
  on(eventName: "queryAbort", handler: (instance: Yasqe, req: Request) => void): this;
  off(eventName: "queryAbort", handler: (instance: Yasqe, req: Request) => void): this;
  on(eventName: "queryResponse", handler: (instance: Yasqe, response: any, duration: number) => void): this;
  off(eventName: "queryResponse", handler: (instance: Yasqe, response: any, duration: number) => void): this;
  showHint: (conf: HintConfig) => void;
  on(eventName: "error", handler: (instance: Yasqe) => void): this;
  off(eventName: "error", handler: (instance: Yasqe) => void): this;
  on(eventName: "blur", handler: (instance: Yasqe) => void): this;
  off(eventName: "blur", handler: (instance: Yasqe) => void): this;
  on(eventName: "queryBefore", handler: (instance: Yasqe, config: YasqeAjaxConfig) => void): this;
  off(eventName: "queryBefore", handler: (instance: Yasqe, config: YasqeAjaxConfig) => void): this;
  on(eventName: "queryResults", handler: (instance: Yasqe, results: any, duration: number) => void): this;
  off(eventName: "queryResults", handler: (instance: Yasqe, results: any, duration: number) => void): this;
  on(eventName: "autocompletionShown", handler: (instance: Yasqe, widget: any) => void): this;
  off(eventName: "autocompletionShown", handler: (instance: Yasqe, widget: any) => void): this;
  on(eventName: "autocompletionClose", handler: (instance: Yasqe) => void): this;
  off(eventName: "autocompletionClose", handler: (instance: Yasqe) => void): this;
  on(eventName: "resize", handler: (instance: Yasqe, newSize: string) => void): this;
  off(eventName: "resize", handler: (instance: Yasqe, newSize: string) => void): this;
  on(eventName: string, handler: () => void): this;
}

export class Yasqe extends EventEmitter {
  private static storageNamespace = "triply";
  public queryValid = true;
  public lastQueryDuration: number | undefined;
  private req: Request | undefined;
  private abortController: AbortController | undefined;
  private queryStatus: "valid" | "error" | undefined;
  private queryBtn: HTMLButtonElement | undefined;
  private resizeWrapper?: HTMLDivElement;
  public rootEl: HTMLDivElement;
  public storage: YStorage = new YStorage(Yasqe.storageNamespace);
  public config: Config;
  public persistentConfig: PersistentConfig | undefined;
  public languageClientWrapper: any;
  public editor: monaco.editor.IStandaloneCodeEditor | undefined; // Monaco editor instance, will be set in initialize

  /**
   * Initializes the Monaco editor in the given element.
   * @param el HTMLElement to initialize the editor in
   * @param conf configuration for the editor
   */
  public async initEditor(el: HTMLElement, conf: PartialConfig = {}) {
    try {
      const wrapper = new MonacoEditorLanguageClientWrapper();
      const wrapperConfig = await buildWrapperConfig(el, this.config.value);
      await wrapper.initAndStart(wrapperConfig);
      this.languageClientWrapper = wrapper.getLanguageClientWrapper("sparql");
      this.editor = wrapper.getEditor();
      // TODO: fix height definition
      el.style.height = "500px";

      // Add backend SPARQL endpoints
      if (this.languageClientWrapper && this.languageClientWrapper.getLanguageClient()) {
        for (const endpointMeta of Object.values(this.persistentConfig?.backends || {})) {
          this.languageClientWrapper
            .getLanguageClient()!
            .sendRequest("qlueLs/addBackend", endpointMeta.backend)
            .catch((err: any) => {
              console.error(err);
            });
          this.languageClientWrapper
            .getLanguageClient()!
            .sendRequest("qlueLs/updateDefaultBackend", endpointMeta.backend.backend.name)
            .catch((err: any) => {
              console.error(err);
            });
        }
      }

      // Register event listeners first, before setting up Monaco editor events
      this.registerEventListeners();

      // Listen for changes in the editor
      this.editor?.getModel()?.onDidChangeContent(() => {
        this.emit("change");
        this.emit("changes");
      });
      // Listen for cursor position changes
      this.editor?.onDidChangeCursorPosition(() => {
        this.emit("cursorActivity");
      });
      // Listen for blur events
      this.editor?.onDidBlurEditorText(() => {
        this.emit("blur");
      });

      // Add commands for editor actions
      monaco.editor.addCommand({
        id: "triggerNewCompletion",
        run: () => {
          this.editor?.trigger("editor", "editor.action.triggerSuggest", {});
        },
      });

      monaco.editor.addCommand({
        id: "jumpToNextPosition",
        run: () => {
          this.languageClientWrapper
            ?.getLanguageClient()!
            .sendRequest("textDocument/formatting", {
              textDocument: { uri: this.editor?.getModel()?.uri.toString() },
              options: {
                tabSize: 2,
                insertSpaces: true,
              },
            })
            .then((response: any) => {
              const edits = response.map((edit: any) => {
                return {
                  range: {
                    startLineNumber: edit.range.start.line + 1,
                    startColumn: edit.range.start.character + 1,
                    endLineNumber: edit.range.end.line + 1,
                    endColumn: edit.range.end.character + 1,
                  },
                  text: edit.newText,
                };
              });
              this.editor?.getModel()!.applyEdits(edits);
              const cursorPosition = this.editor?.getPosition();
              if (cursorPosition) {
                this.languageClientWrapper
                  ?.getLanguageClient()!
                  .sendRequest("qlueLs/jump", {
                    textDocument: { uri: this.editor?.getModel()?.uri.toString() },
                    position: {
                      line: cursorPosition?.lineNumber - 1,
                      character: cursorPosition?.column - 1,
                    },
                  })
                  .then((response: any) => {
                    if (response) {
                      const newCursorPosition = {
                        lineNumber: response.position.line + 1,
                        column: response.position.character + 1,
                      };
                      if (response.insertAfter) {
                        this.editor?.executeEdits("jumpToNextPosition", [
                          {
                            range: new monaco.Range(
                              newCursorPosition.lineNumber,
                              newCursorPosition.column,
                              newCursorPosition.lineNumber,
                              newCursorPosition.column
                            ),
                            text: response.insertAfter,
                          },
                        ]);
                      }
                      this.editor?.setPosition(newCursorPosition, "jumpToNextPosition");
                      if (response.insertBefore) {
                        this.editor?.getModel()?.applyEdits([
                          {
                            range: new monaco.Range(
                              newCursorPosition.lineNumber,
                              newCursorPosition.column,
                              newCursorPosition.lineNumber,
                              newCursorPosition.column
                            ),
                            text: response.insertBefore,
                          },
                        ]);
                      }
                      this.editor?.trigger("editor", "editor.action.triggerSuggest", {});
                    }
                  });
              }
            });
          this.editor?.trigger("jumpToNextPosition", "editor.action.formatDocument", {});
          // console.log("jump to next location");
        },
      });
      monaco.editor.addKeybindingRule({
        command: "jumpToNextPosition",
        keybinding: monaco.KeyMod.Alt | monaco.KeyCode.KeyN,
      });
      wrapper.getEditor()!.addAction({
        id: "Execute Query",
        label: "Execute",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.5,
        run: (editor, ...args) => {
          // run_query(this.getBackend().url, this.getValue())
          this.query().catch(() => {}); //catch this to avoid unhandled rejection
        },
      });

      const overlay = new LspInfoOverlayWidget(wrapper.getEditor()!, this.persistentConfig?.backends || {});
      wrapper.getEditor()!.addOverlayWidget(overlay);

      // Do some post processing, init storage
      this.drawButtons();
      const storageId = this.getStorageId();
      if (storageId) {
        const persConf = this.storage.get<any>(storageId);
        if (persConf && typeof persConf === "string") {
          this.persistentConfig = { query: persConf, editorHeight: this.config.editorHeight, backends: {} };
        } else {
          this.persistentConfig = persConf;
        }
        if (!this.persistentConfig)
          this.persistentConfig = { query: this.getValue(), editorHeight: this.config.editorHeight, backends: {} };
        if (this.persistentConfig && this.persistentConfig.query) this.setValue(this.persistentConfig.query);
      }

      if (this.config.consumeShareLink) {
        this.config.consumeShareLink(this);
        //and: add a hash listener!
        window.addEventListener("hashchange", this.handleHashChange);
      }
      // Add beforeunload event to save query when tab/window changes
      window.addEventListener("beforeunload", this.handleBeforeUnload);
      // Add visibility change event to save query when tab becomes hidden
      document.addEventListener("visibilitychange", this.handleVisibilityChange);

      // // Size editor to the height of the wrapper element
      // if (this.persistentConfig && this.persistentConfig.editorHeight) {
      //   this.getWrapperElement().style.height = this.persistentConfig.editorHeight;
      // } else if (this.config.editorHeight) {
      //   this.getWrapperElement().style.height = this.config.editorHeight;
      // }
      // if (this.config.resizeable) this.drawResizer();
      // if (this.config.collapsePrefixesOnLoad) this.collapsePrefixes(true);
    } catch (error) {
      console.error("Failed to initialize Monaco editor:", error);
      // Fallback to show error message in the element
      el.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background: #ffebee;">
        Error initializing SPARQL editor: ${error instanceof Error ? error.message : String(error)}
      </div>`;
      throw error;
    }
  }

  public getValue(): string {
    return this.editor?.getValue() || "";
  }

  public setValue(newValue: string) {
    this.editor?.setValue(newValue);
  }

  public getWrapperElement(): HTMLDivElement {
    return this.rootEl;
  }

  constructor(parent: HTMLElement, conf: PartialConfig = {}) {
    super();
    if (!parent) throw new Error("No parent passed as argument. Dont know where to draw YASQE");
    this.rootEl = document.createElement("div");
    this.rootEl.className = "yasqe";
    parent.appendChild(this.rootEl);

    this.config = merge({}, Yasqe.defaults, conf);

    // Initialize the editor and then setup everything else
    this.initEditor(this.rootEl).then(() => {
      this.setupAfterEditorInit();
    });
  }

  private handleBeforeUnload = () => {
    this.saveQuery();
  };

  private handleVisibilityChange = () => {
    if (document.hidden) this.saveQuery();
  };

  private setupAfterEditorInit() {}

  public getDoc() {
    if (!this.editor) throw new Error("Editor not initialized");
    return {
      // Get the current cursor position
      getCursor: (position: string = "head") => {
        const selection = this.editor!.getSelection();
        if (!selection) return { line: 0, ch: 0 };

        // In CodeMirror, 'start' is the beginning of selection, 'end' is the end,
        // 'head' is the moving end, and 'anchor' is the fixed end
        if (position === "start" || (position === "head" && !selection.isEmpty())) {
          const pos = selection.getStartPosition();
          return { line: pos.lineNumber - 1, ch: pos.column - 1 };
        } else if (position === "end" || position === "head") {
          const pos = selection.getEndPosition();
          return { line: pos.lineNumber - 1, ch: pos.column - 1 };
        } else {
          // 'anchor'
          const pos = selection.getPosition();
          return { line: pos.lineNumber - 1, ch: pos.column - 1 };
        }
      },
      // Get line content
      getLine: (line: number) => {
        if (!this.editor?.getModel()) return "";
        return this.editor.getModel()!.getLineContent(line + 1); // Monaco is 1-based
      },
      // Get the last line number
      lastLine: () => {
        return this.editor?.getModel()?.getLineCount() ? this.editor!.getModel()!.getLineCount() - 1 : 0;
      },
      // Check if something is selected
      somethingSelected: () => {
        const selection = this.editor!.getSelection();
        return selection ? !selection.isEmpty() : false;
      },
      // Get the selected text
      getSelection: () => {
        if (!this.editor?.getModel()) return "";
        const selection = this.editor.getSelection();
        if (!selection) return "";
        return this.editor.getModel()!.getValueInRange(selection);
      },
      // Replace a range of text
      replaceRange: (text: string, from: Position, to?: Position) => {
        if (!this.editor?.getModel()) return;
        const fromPos = {
          lineNumber: from.line + 1,
          column: from.ch + 1,
        };
        const toPos = to
          ? {
              lineNumber: to.line + 1,
              column: to.ch + 1,
            }
          : fromPos;
        this.editor.executeEdits("api", [
          {
            range: new monaco.Range(fromPos.lineNumber, fromPos.column, toPos.lineNumber, toPos.column),
            text: text,
          },
        ]);
      },
      // Get index from position
      indexFromPos: (pos: Position) => {
        if (!this.editor?.getModel()) return 0;
        return this.editor.getModel()!.getOffsetAt({
          lineNumber: pos.line + 1,
          column: pos.ch + 1,
        });
      },
      // Get position from index
      posFromIndex: (index: number) => {
        if (!this.editor?.getModel()) return { line: 0, ch: 0 };
        const position = this.editor.getModel()!.getPositionAt(index);
        return {
          line: position.lineNumber - 1,
          ch: position.column - 1,
        };
      },
    };
  }

  private handleHashChange = () => {
    this.config.consumeShareLink?.(this);
  };
  private handleChange() {
    this.updateQueryButton();
    this.saveQuery(); // Save query on every change
  }
  private handleBlur() {
    this.saveQuery();
  }
  private handleChanges() {
    // e.g. handle blur
    this.updateQueryButton();
    this.saveQuery();
  }
  private handleCursorActivity() {
    // this.autocomplete(true);
  }
  private handleQuery(_yasqe: Yasqe, req: Request, abortController?: AbortController) {
    this.req = req;
    this.abortController = abortController;
    this.updateQueryButton();
  }
  private handleQueryResponse(_yasqe: Yasqe, _response: any, duration: number) {
    this.lastQueryDuration = duration;
    this.req = undefined;
    this.updateQueryButton();
  }
  private handleQueryAbort(_yasqe: Yasqe, _req: Request) {
    this.req = undefined;
    this.updateQueryButton();
  }

  private registerEventListeners() {
    /**
     * Register listeners
     */
    this.on("change", this.handleChange);
    this.on("blur", this.handleBlur);
    this.on("changes", this.handleChanges);
    this.on("cursorActivity", this.handleCursorActivity);

    this.on("query", this.handleQuery);
    this.on("queryResponse", this.handleQueryResponse);
    this.on("queryAbort", this.handleQueryAbort);
  }

  private unregisterEventListeners() {
    this.off("change" as any, this.handleChange);
    this.off("blur", this.handleBlur);
    this.off("changes" as any, this.handleChanges);
    this.off("cursorActivity" as any, this.handleCursorActivity);

    this.off("query", this.handleQuery);
    this.off("queryResponse", this.handleQueryResponse);
    this.off("queryAbort", this.handleQueryAbort);
  }
  // /**
  //  * Generic IDE functions
  //  */
  // public emit(event: string, ...data: any[]) {
  //   // CodeMirror.signal(this, event, this, ...data);
  // }

  public getStorageId(getter?: Config["persistenceId"]): string | undefined {
    const persistenceId = getter || this.config.persistenceId;
    if (!persistenceId) return undefined;
    if (typeof persistenceId === "string") return persistenceId;
    return persistenceId(this);
  }
  private drawButtons() {
    const buttons = document.createElement("div");
    buttons.className = "yasqe_buttons";
    this.getWrapperElement().appendChild(buttons);

    if (this.config.pluginButtons) {
      const pluginButtons = this.config.pluginButtons();
      if (!pluginButtons) return;
      if (Array.isArray(pluginButtons)) {
        for (const button of pluginButtons) {
          buttons.append(button);
        }
      } else {
        buttons.appendChild(pluginButtons);
      }
    }

    /**
     * draw share link button
     */
    if (this.config.createShareableLink) {
      const svgShare = drawSvgStringAsElement(imgs.share);
      const shareLinkWrapper = document.createElement("button");
      shareLinkWrapper.className = "yasqe_share";
      shareLinkWrapper.title = "Share query";
      shareLinkWrapper.setAttribute("aria-label", "Share query");
      shareLinkWrapper.appendChild(svgShare);
      buttons.appendChild(shareLinkWrapper);
      shareLinkWrapper.addEventListener("click", (event: MouseEvent) => showSharePopup(event));
      shareLinkWrapper.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.code === "Enter") {
          showSharePopup(event);
        }
      });

      const showSharePopup = (event: MouseEvent | KeyboardEvent) => {
        event.stopPropagation();
        let popup: HTMLDivElement | undefined = document.createElement("div");
        popup.className = "yasqe_sharePopup";
        buttons.appendChild(popup);
        document.body.addEventListener(
          "click",
          (event) => {
            if (popup && event.target !== popup && !popup.contains(<any>event.target)) {
              popup.remove();
              popup = undefined;
            }
          },
          true
        );
        const input = document.createElement("input");
        input.type = "text";
        input.value = this.config.createShareableLink(this);

        input.onfocus = function () {
          input.select();
        };
        // Work around Chrome's little problem
        input.onmouseup = function () {
          // $this.unbind("mouseup");
          return false;
        };
        popup.innerHTML = "";

        const inputWrapper = document.createElement("div");
        inputWrapper.className = "inputWrapper";

        inputWrapper.appendChild(input);

        popup.appendChild(inputWrapper);

        // We need to track which buttons are drawn here since the two implementations don't play nice together
        const popupInputButtons: HTMLButtonElement[] = [];
        const createShortLink = this.config.createShortLink;
        if (createShortLink) {
          popup.className = popup.className += " enableShort";
          const shortBtn = document.createElement("button");
          popupInputButtons.push(shortBtn);
          shortBtn.innerHTML = "Shorten";
          shortBtn.className = "yasqe_btn yasqe_btn-sm shorten";
          popup.appendChild(shortBtn);
          shortBtn.onclick = () => {
            popupInputButtons.forEach((button) => (button.disabled = true));
            createShortLink(this, input.value).then(
              (value) => {
                input.value = value;
                input.focus();
              },
              (err) => {
                const errSpan = document.createElement("span");
                errSpan.className = "shortlinkErr";
                // Throwing a string or an object should work
                let textContent = "An error has occurred";
                if (typeof err === "string" && err.length !== 0) {
                  textContent = err;
                } else if (err.message && err.message.length !== 0) {
                  textContent = err.message;
                }
                errSpan.textContent = textContent;
                input.replaceWith(errSpan);
              }
            );
          };
        }

        const curlBtn = document.createElement("button");
        popupInputButtons.push(curlBtn);
        curlBtn.innerText = "cURL";
        curlBtn.className = "yasqe_btn yasqe_btn-sm curl";
        popup.appendChild(curlBtn);
        curlBtn.onclick = () => {
          popupInputButtons.forEach((button) => (button.disabled = true));
          input.value = this.getAsCurlString();
          input.focus();
          popup?.appendChild(curlBtn);
        };

        const svgPos = svgShare.getBoundingClientRect();
        popup.style.top = svgShare.offsetTop + svgPos.height + "px";
        popup.style.left = svgShare.offsetLeft + svgShare.clientWidth - popup.clientWidth + "px";
        input.focus();
      };
    }
    /**
     * Draw query btn
     */
    if (this.config.showQueryButton) {
      this.queryBtn = document.createElement("button");
      addClass(this.queryBtn, "yasqe_queryButton");

      /**
       * Add busy/valid/error btns
       */
      const queryEl = drawSvgStringAsElement(imgs.query);
      addClass(queryEl, "queryIcon");
      this.queryBtn.appendChild(queryEl);

      const warningIcon = drawSvgStringAsElement(imgs.warning);
      addClass(warningIcon, "warningIcon");
      this.queryBtn.appendChild(warningIcon);

      this.queryBtn.onclick = () => {
        if (this.config.queryingDisabled) return; // Don't do anything
        if (this.req) {
          this.abortQuery();
        } else {
          this.query().catch(() => {}); //catch this to avoid unhandled rejection
        }
      };
      this.queryBtn.title = "Run query";
      this.queryBtn.setAttribute("aria-label", "Run query");

      buttons.appendChild(this.queryBtn);
      this.updateQueryButton();
    }
  }
  // private drawResizer() {
  //   if (this.resizeWrapper) return;
  //   this.resizeWrapper = document.createElement("div");
  //   addClass(this.resizeWrapper, "resizeWrapper");
  //   const chip = document.createElement("div");
  //   addClass(chip, "resizeChip");
  //   this.resizeWrapper.appendChild(chip);
  //   this.resizeWrapper.addEventListener("mousedown", this.initDrag, false);
  //   this.resizeWrapper.addEventListener("dblclick", this.expandEditor);
  //   this.rootEl.appendChild(this.resizeWrapper);
  // }
  private initDrag() {
    document.documentElement.addEventListener("mousemove", this.doDrag, false);
    document.documentElement.addEventListener("mouseup", this.stopDrag, false);
  }
  private calculateDragOffset(event: MouseEvent, rootEl: HTMLElement) {
    let parentOffset = 0;
    // offsetParent is, at the time of writing, a working draft. see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
    if (rootEl.offsetParent) parentOffset = (rootEl.offsetParent as HTMLElement).offsetTop;
    let scrollOffset = 0;
    let parentElement = rootEl.parentElement;
    while (parentElement) {
      scrollOffset += parentElement.scrollTop;
      parentElement = parentElement.parentElement;
    }
    return event.clientY - parentOffset - this.rootEl.offsetTop + scrollOffset;
  }
  private doDrag(event: MouseEvent) {
    this.getWrapperElement().style.height = this.calculateDragOffset(event, this.rootEl) + "px";
  }
  private stopDrag() {
    document.documentElement.removeEventListener("mousemove", this.doDrag, false);
    document.documentElement.removeEventListener("mouseup", this.stopDrag, false);
    this.emit("resize", this.getWrapperElement().style.height);
    if (this.getStorageId() && this.persistentConfig) {
      // If there is no storage id there is no persistency wanted
      this.persistentConfig.editorHeight = this.getWrapperElement().style.height;
      this.saveQuery();
    }
    // Refresh the editor to make sure the 'hidden' lines are rendered
    // this.refresh();
  }
  public duplicateLine() {
    const cur = this.getDoc().getCursor();
    if (cur) {
      const line = this.getDoc().getLine(cur.line);
      this.getDoc().replaceRange(line + "\n" + line, { ch: 0, line: cur.line }, { ch: line.length, line: cur.line });
    }
  }
  private updateQueryButton(status?: "valid" | "error") {
    if (!this.queryBtn) return;

    /**
     * Set query status (valid vs invalid)
     */
    if (this.config.queryingDisabled) {
      addClass(this.queryBtn, "query_disabled");
      this.queryBtn.title = this.config.queryingDisabled;
    } else {
      removeClass(this.queryBtn, "query_disabled");
      this.queryBtn.title = "Run query";
      this.queryBtn.setAttribute("aria-label", "Run query");
    }
    if (!status) {
      status = this.queryValid ? "valid" : "error";
    }
    if (status != this.queryStatus) {
      //reset query status classnames
      removeClass(this.queryBtn, "query_" + this.queryStatus);
      addClass(this.queryBtn, "query_" + status);
      this.queryStatus = status;
    }

    /**
     * Set/remove spinner if needed
     */
    if (this.req && this.queryBtn.className.indexOf("busy") < 0) {
      this.queryBtn.className = this.queryBtn.className += " busy";
    }
    if (!this.req && this.queryBtn.className.indexOf("busy") >= 0) {
      this.queryBtn.className = this.queryBtn.className.replace("busy", "");
    }
  }
  public handleLocalStorageQuotaFull(_e: any) {
    console.warn("Localstorage quota exceeded. Clearing all queries");
    Yasqe.clearStorage();
  }

  public saveQuery() {
    const storageId = this.getStorageId();
    if (!storageId || !this.persistentConfig) return;
    this.persistentConfig.query = this.getValue();
    this.storage.set(storageId, this.persistentConfig, this.config.persistencyExpire, this.handleLocalStorageQuotaFull);
  }

  /**
   * Get SPARQL query props
   */
  public getQueryType() {
    // TODO: remove? Or get from Qlue-ls? Or from sparql.js
    // return this.getOption("queryType");
    return "SELECT";
  }
  public getQueryMode(): "update" | "query" {
    switch (this.getQueryType()) {
      case "INSERT":
      case "DELETE":
      case "LOAD":
      case "CLEAR":
      case "CREATE":
      case "DROP":
      case "COPY":
      case "MOVE":
      case "ADD":
        return "update";
      default:
        return "query";
    }
  }

  // public getValueWithoutComments() {
  //   var cleanedQuery = "";
  //   (<any>Yasqe).runMode(this.getValue(), "sparql11", function (stringVal: string, className: string) {
  //     if (className != "comment") {
  //       cleanedQuery += stringVal;
  //     }
  //   });
  //   return cleanedQuery;
  // }

  /**
   * Token management
   */
  public getCompleteToken(token?: Token, cur?: Position): Token | undefined {
    // return getCompleteToken(this, token, cur);
    return undefined;
  }
  public getPreviousNonWsToken(line: number, token: Token): Token {
    return getPreviousNonWsToken(this, line, token);
  }
  public getNextNonWsToken(lineNumber: number, charNumber?: number): Token | undefined {
    return getNextNonWsToken(this, lineNumber, charNumber);
  }
  /**
   * Notification management
   */
  private notificationEls: { [key: string]: HTMLDivElement } = {};

  /**
   * Shows notification
   * @param key reference to the notification
   * @param message the message to display
   */
  public showNotification(key: string, message: string) {
    if (!this.notificationEls[key]) {
      // We create one wrapper for each notification, since there is no interactivity with the container (yet) we don't need to keep a reference
      const notificationContainer = document.createElement("div");
      addClass(notificationContainer, "notificationContainer");
      this.getWrapperElement().appendChild(notificationContainer);

      // Create the actual notification element
      this.notificationEls[key] = document.createElement("div");
      addClass(this.notificationEls[key], "notification", "notif_" + key);
      notificationContainer.appendChild(this.notificationEls[key]);
    }
    // Hide others
    for (const notificationId in this.notificationEls) {
      if (notificationId !== key) this.hideNotification(notificationId);
    }
    const el = this.notificationEls[key];
    addClass(el, "active");
    el.innerText = message;
  }
  /**
   * Hides notification
   * @param key the identifier of the notification to hide
   */
  public hideNotification(key: string) {
    if (this.notificationEls[key]) {
      removeClass(this.notificationEls[key], "active");
    }
  }

  /**
   * Prefix management
   */
  public collapsePrefixes(collapse = true) {
    const firstPrefixLine = findFirstPrefixLine(this);
    if (firstPrefixLine === undefined) return; //nothing to collapse
    // this.foldCode(firstPrefixLine, (<any>CodeMirror).fold.prefix, collapse ? "fold" : "unfold");
  }

  public getPrefixesFromQuery(): Prefixes {
    return getPrefixesFromQuery(this);
  }
  public addPrefixes(prefixes: string | Prefixes): void {
    return addPrefixes(this, prefixes);
  }
  public removePrefixes(prefixes: Prefixes): void {
    return removePrefixes(this, prefixes);
  }
  public updateWidget() {
    if (
      (this as any).cursorCoords &&
      (this as any).state.completionActive &&
      (this as any).state.completionActive.widget
    ) {
      const newTop: string = (this as any).cursorCoords(null).bottom;
      (this as any).state.completionActive.widget.hints.style.top = newTop + "px";
    }
  }

  /**
   * Querying
   */
  public query(config?: Sparql.YasqeAjaxConfig) {
    if (this.config.queryingDisabled) return Promise.reject("Querying is disabled.");
    // Abort previous request
    this.abortQuery();
    return Sparql.executeQuery(this, config);
  }
  public getUrlParams() {
    //first try hash
    let urlParams: queryString.ParsedQuery = {};
    if (window.location.hash.length > 1) {
      //firefox does some decoding if we're using window.location.hash (e.g. the + sign in contentType settings)
      //Don't want this. So simply get the hash string ourselves
      urlParams = queryString.parse(location.hash);
    }
    if ((!urlParams || !("query" in urlParams)) && window.location.search.length > 1) {
      //ok, then just try regular url params
      urlParams = queryString.parse(window.location.search);
    }
    return urlParams;
  }
  public configToQueryParams(): queryString.ParsedQuery {
    //extend existing link, so first fetch current arguments
    let urlParams: any = {};
    if (window.location.hash.length > 1) urlParams = queryString.parse(window.location.hash);
    urlParams["query"] = this.getValue();
    return urlParams;
  }
  public queryParamsToConfig(params: queryString.ParsedQuery) {
    if (params && params.query && typeof params.query === "string") {
      this.setValue(params.query);
    }
  }

  public getAsCurlString(config?: Sparql.YasqeAjaxConfig): string {
    return Sparql.getAsCurlString(this, config);
  }

  public abortQuery() {
    if (this.req) {
      if (this.abortController) {
        this.abortController.abort();
      }
      this.emit("queryAbort", this, this.req);
    }
  }

  public expandEditor() {
    // TODO: this.setSize(null, "100%");
  }

  public destroy() {
    // Abort running query
    this.abortQuery();
    this.unregisterEventListeners();
    this.resizeWrapper?.removeEventListener("mousedown", this.initDrag, false);
    this.resizeWrapper?.removeEventListener("dblclick", this.expandEditor);
    window.removeEventListener("hashchange", this.handleHashChange);
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.rootEl.remove();
  }

  /**
   * Statics
   */
  static Sparql = Sparql;
  static clearStorage() {
    const storage = new YStorage(Yasqe.storageNamespace);
    storage.removeNamespace();
  }
  static defaults = getDefaults();
}

export type TokenizerState = sparql11Mode.State;
export type Position = CodeMirror.Position;
export type Token = CodeMirror.Token;

export interface HintList {
  list: Hint[];
  from: Position;
  to: Position;
}
export interface Hint {
  text: string;
  displayText?: string;
  className?: string;
  render?: (el: HTMLElement, self: Hint, data: any) => void;
  from?: Position;
  to?: Position;
}

export type HintFn = { async?: boolean } & (() => Promise<HintList> | HintList);
export interface HintConfig {
  completeOnSingleClick?: boolean;
  container?: HTMLElement;
  closeCharacters?: RegExp;
  completeSingle?: boolean;
  // A hinting function, as specified above. It is possible to set the async property on a hinting function to true, in which case it will be called with arguments (cm, callback, ?options), and the completion interface will only be popped up when the hinting function calls the callback, passing it the object holding the completions. The hinting function can also return a promise, and the completion interface will only be popped when the promise resolves. By default, hinting only works when there is no selection. You can give a hinting function a supportsSelection property with a truthy value to indicate that it supports selections.
  hint: HintFn;

  // Whether the pop-up should be horizontally aligned with the start of the word (true, default), or with the cursor (false).
  alignWithWord?: boolean;
  // When enabled (which is the default), the pop-up will close when the editor is unfocused.
  closeOnUnfocus?: boolean;
  // Allows you to provide a custom key map of keys to be active when the pop-up is active. The handlers will be called with an extra argument, a handle to the completion menu, which has moveFocus(n), setFocus(n), pick(), and close() methods (see the source for details), that can be used to change the focused element, pick the current element or close the menu. Additionally menuSize() can give you access to the size of the current dropdown menu, length give you the number of available completions, and data give you full access to the completion returned by the hinting function.
  customKeys?: any;

  // Like customKeys above, but the bindings will be added to the set of default bindings, instead of replacing them.
  extraKeys?: {
    [key: string]: (
      yasqe: Yasqe,
      event: {
        close: () => void;
        data: {
          from: Position;
          to: Position;
          list: Hint[];
        };
        length: number;
        menuSize: () => void;
        moveFocus: (movement: number) => void;
        pick: () => void;
        setFocus: (index: number) => void;
      }
    ) => void;
  };
}
export interface RequestConfig<Y> {
  queryArgument: string | ((yasqe: Y) => string) | undefined;
  endpoint: string | ((yasqe: Y) => string);
  method: "POST" | "GET" | ((yasqe: Y) => "POST" | "GET");
  acceptHeaderGraph: string | ((yasqe: Y) => string);
  acceptHeaderSelect: string | ((yasqe: Y) => string);
  acceptHeaderUpdate: string | ((yasqe: Y) => string);
  namedGraphs: string[] | ((yasqe: Y) => string[]);
  defaultGraphs: string[] | ((yasqe: Y) => []);
  args: Array<{ name: string; value: string }> | ((yasqe: Y) => Array<{ name: string; value: string }>);
  headers: { [key: string]: string } | ((yasqe: Y) => { [key: string]: string });
  withCredentials: boolean | ((yasqe: Y) => boolean);
  adjustQueryBeforeRequest: ((yasqe: Y) => string) | false;
}
export type PlainRequestConfig = {
  [K in keyof RequestConfig<any>]: Exclude<RequestConfig<any>[K], Function>;
};
export type PartialConfig = {
  [P in keyof Config]?: Config[P] extends object ? Partial<Config[P]> : Config[P];
};
export interface Config extends Partial<CodeMirror.EditorConfiguration> {
  mode: string;
  collapsePrefixesOnLoad: boolean;
  syntaxErrorCheck: boolean;
  /**
   * Show a button with which users can create a link to this query. Set this value to null to disable this functionality.
   * By default, this feature is enabled, and the only the query value is appended to the link.
   * ps. This function should return an object which is parseable by jQuery.param (http://api.jquery.com/jQuery.param/)
   */
  createShareableLink: (yasqe: Yasqe) => string;
  createShortLink: ((yasqe: Yasqe, longLink: string) => Promise<string>) | undefined;
  consumeShareLink: ((yasqe: Yasqe) => void) | undefined | null;
  /**
   * Change persistency settings for the YASQE query value. Setting the values
   * to null, will disable persistancy: nothing is stored between browser
   * sessions Setting the values to a string (or a function which returns a
   * string), will store the query in localstorage using the specified string.
   * By default, the ID is dynamically generated using the closest dom ID, to avoid collissions when using multiple YASQE items on one
   * page
   */
  persistenceId: ((yasqe: Yasqe) => string) | string | undefined | null;
  persistencyExpire: number; //seconds
  showQueryButton: boolean;
  requestConfig: RequestConfig<Yasqe> | ((yasqe: Yasqe) => RequestConfig<Yasqe>);
  pluginButtons: (() => HTMLElement[] | HTMLElement) | undefined;
  //Addon specific addon ts defs, or missing props from codemirror conf
  highlightSelectionMatches: { showToken?: RegExp; annotateScrollbar?: boolean };
  tabMode: string;
  foldGutter: any; //This should be of type boolean, or an object. However, setting it to any to avoid
  //ts complaining about incorrectly extending, as the cm def only defined it has having a boolean type.
  matchBrackets: boolean;
  hintConfig: Partial<HintConfig>;
  resizeable: boolean;
  editorHeight: string;
  queryingDisabled: string | undefined; // The string will be the message displayed when hovered
  prefixCcApi: string; // the suggested default prefixes URL API getter
}

export interface PersistentConfig {
  query: string;
  editorHeight: string;
  backends: { [key: string]: EndpointMetadata };
}

//add missing static functions, added by e.g. addons
// declare function runMode(text:string, mode:any, out:any):void

export default Yasqe;
