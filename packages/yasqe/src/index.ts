import { EventEmitter } from "events";
import { Storage as YStorage } from "@sib-swiss/yasgui-utils";
import * as queryString from "query-string";
import { drawSvgStringAsElement, addClass, removeClass } from "@sib-swiss/yasgui-utils";
import { merge } from "lodash-es";
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper";
import * as monaco from "monaco-editor";
// import { initialize } from '@codingame/monaco-vscode-api'
// import getConfigurationServiceOverride, { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override'

import * as Sparql from "./sparql";
import * as imgs from "./imgs";
import { buildWrapperConfig, getVsThemeConfig } from "./editor/editorConfig";
import getDefaults from "./defaults";
import { YasqeAjaxConfig } from "./sparql";
import { EndpointMetadata } from "./editor/endpointMetadata";
// import tooltip from "./tooltip";
import "./scss/yasqe.css";
import "./scss/buttons.css";
import { initialize } from "@codingame/monaco-vscode-api";
import getLayoutServiceOverride from "@codingame/monaco-vscode-layout-service-override";
import getConfigurationServiceOverride from "@codingame/monaco-vscode-configuration-service-override";
// import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override';

export interface Yasqe {
  on(eventName: "query", handler: (instance: Yasqe, req: Request, abortController?: AbortController) => void): this;
  off(eventName: "query", handler: (instance: Yasqe, req: Request, abortController?: AbortController) => void): this;
  on(eventName: "queryAbort", handler: (instance: Yasqe, req: Request) => void): this;
  off(eventName: "queryAbort", handler: (instance: Yasqe, req: Request) => void): this;
  on(eventName: "queryResponse", handler: (instance: Yasqe, response: any, duration: number) => void): this;
  off(eventName: "queryResponse", handler: (instance: Yasqe, response: any, duration: number) => void): this;
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
  public monacoWrapper: MonacoEditorLanguageClientWrapper | undefined;
  public editor: monaco.editor.IStandaloneCodeEditor | undefined; // Monaco editor instance, will be set in initialize

  /**
   * Initializes the Monaco editor in the given element.
   * @param el HTMLElement to initialize the editor in
   * @param conf configuration for the editor
   */
  public async initEditor(el: HTMLElement, conf: PartialConfig = {}) {
    try {
      // try {
      //   // Trying to fix issue with VSCode services override init in prod
      //   await initialize({
      //   // ...getEditorServiceOverride(),
      //   ...getConfigurationServiceOverride(),
      //   ...getLayoutServiceOverride(),
      // });
      // } catch (error) {
      //   console.warn("Error while initializing Monaco editor services override:", error);
      // }
      // json config like in vscode settings.json
      // updateUserConfiguration(`{
      //     "editor.fontSize": 30, "editor.lineHeight": 30, "editor.letterSpacing": 0,
      // }`)
      // import { StaticServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices';
      // const codeEditorService = StaticServices.codeEditorService.get();
      const wrapper = new MonacoEditorLanguageClientWrapper();
      const wrapperConfig = await buildWrapperConfig(el, this.config.value, this.config.theme);
      // console.log("BEFORE ERROR IN INIT AND START")
      await wrapper.initAndStart(wrapperConfig);
      // console.log("AFTER INIT AND START")

      this.monacoWrapper = wrapper;
      this.languageClientWrapper = wrapper.getLanguageClientWrapper("sparql");
      this.editor = this.monacoWrapper.getEditor();
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

      // Size editor to the height of the wrapper element
      if (this.persistentConfig && this.persistentConfig.editorHeight) {
        this.setSize(this.persistentConfig.editorHeight);
      } else if (this.config.editorHeight) {
        this.setSize(this.config.editorHeight);
      }
      if (this.config.resizeable) this.drawResizer();
      // if (this.config.collapsePrefixesOnLoad) this.collapsePrefixes(true);
      // TODO: add widgets?
      // const overlay = new LspInfoOverlayWidget(wrapper.getEditor()!, this.persistentConfig?.backends || {});
      // wrapper.getEditor()!.addOverlayWidget(overlay);
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

  /**
   * Switch the theme of the Monaco editor
   * @param theme - The theme to switch to ('light' or 'dark')
   */
  public async setTheme(theme: "light" | "dark"): Promise<void> {
    document.documentElement.dataset.theme = theme;
    monaco.editor.setTheme(getVsThemeConfig(theme));
    // console.log("Options:", this.monacoWrapper?.getEditor()?.getRawOptions().theme)
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
    this.initEditor(this.rootEl);
  }

  private handleBeforeUnload = () => {
    this.saveQuery();
  };

  private handleVisibilityChange = () => {
    if (document.hidden) this.saveQuery();
  };

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
  private drawResizer() {
    if (this.resizeWrapper) return;
    this.resizeWrapper = document.createElement("div");
    addClass(this.resizeWrapper, "resizeWrapper");
    const chip = document.createElement("div");
    addClass(chip, "resizeChip");
    this.resizeWrapper.appendChild(chip);
    this.resizeWrapper.addEventListener("mousedown", this.initDrag.bind(this), false);
    this.resizeWrapper.addEventListener("dblclick", this.expandEditor.bind(this));
    this.rootEl.appendChild(this.resizeWrapper);
  }
  private boundDoDrag = (event: MouseEvent) => this.doDrag(event);
  private boundStopDrag = () => this.stopDrag();
  private initDrag(event: MouseEvent) {
    event.preventDefault();
    document.documentElement.addEventListener("mousemove", this.boundDoDrag, false);
    document.documentElement.addEventListener("mouseup", this.boundStopDrag, false);
  }
  private calculateDragOffset(event: MouseEvent, rootEl: HTMLElement) {
    const rect = rootEl.getBoundingClientRect();
    return event.clientY - rect.top;
  }
  private doDrag(event: MouseEvent) {
    event.preventDefault();
    const newHeight = this.calculateDragOffset(event, this.rootEl);
    const minHeight = 100; // Minimum height in pixels
    const maxHeight = window.innerHeight - 100; // Maximum height
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    this.getWrapperElement().style.height = constrainedHeight + "px";
    // Resize the Monaco editor to fit the new container size
    if (this.editor) {
      this.editor.layout();
    }
  }
  private stopDrag() {
    document.documentElement.removeEventListener("mousemove", this.boundDoDrag, false);
    document.documentElement.removeEventListener("mouseup", this.boundStopDrag, false);
    this.emit("resize", this.getWrapperElement().style.height);
    if (this.getStorageId() && this.persistentConfig) {
      // If there is no storage id there is no persistency wanted
      this.persistentConfig.editorHeight = this.getWrapperElement().style.height;
      this.saveQuery();
    }
    // Refresh the editor to make sure the 'hidden' lines are rendered
    if (this.editor) {
      this.editor.layout();
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
    this.setSize("60vh", "100%");
  }

  public setSize(height?: string, width?: string) {
    if (height) this.getWrapperElement().style.height = height;
    if (width) this.getWrapperElement().style.width = width;
    // Resize the Monaco editor to fit the new container size
    // if (this.editor) this.editor.layout();
  }

  public destroy() {
    // Abort running query
    this.abortQuery();
    this.unregisterEventListeners();
    this.resizeWrapper?.removeEventListener("mousedown", this.initDrag.bind(this), false);
    this.resizeWrapper?.removeEventListener("dblclick", this.expandEditor.bind(this));
    // Clean up any remaining drag listeners
    document.documentElement.removeEventListener("mousemove", this.doDrag.bind(this), false);
    document.documentElement.removeEventListener("mouseup", this.stopDrag.bind(this), false);
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
  //ts complaining about incorrectly extending, as the cm def only defined it has having a boolean type.
  matchBrackets: boolean;
  resizeable: boolean;
  editorHeight: string;
  queryingDisabled: string | undefined; // The string will be the message displayed when hovered
  theme: "light" | "dark";
}

export interface PersistentConfig {
  query: string;
  editorHeight: string;
  backends: { [key: string]: EndpointMetadata };
}

export default Yasqe;

// class LspInfoOverlayWidget implements monaco.editor.IOverlayWidget {
//   private domNode: HTMLElement;

//   constructor(private readonly editor: monaco.editor.IStandaloneCodeEditor, backend: any) {
//     this.domNode = document.createElement("div");
//     this.domNode.style.background = "#444";
//     this.domNode.style.color = "#fff";
//     this.domNode.style.padding = "0.3em 0.5em";
//     this.domNode.style.fontSize = "12px";
//     this.domNode.style.borderRadius = "4px";
//     this.domNode.style.cursor = "pointer";
//     this.domNode.addEventListener("mouseover", () => {
//       this.domNode.style.filter = "brightness(60%)";
//     });
//     this.domNode.addEventListener("mouseout", () => {
//       this.domNode.style.filter = "";
//     });
//     this.domNode.innerText = "ℹ️ Backends Info";
//     this.domNode.onclick = () => {
//       // const info = getLanguageServerState();
//       alert(JSON.stringify(backend, null, 2));
//     };
//   }
//   getId(): string {
//     return "lsp.info.overlay";
//   }
//   getDomNode(): HTMLElement {
//     return this.domNode;
//   }
//   getPosition(): monaco.editor.IOverlayWidgetPosition {
//     return {
//       preference: monaco.editor.OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER,
//     };
//   }
// }
