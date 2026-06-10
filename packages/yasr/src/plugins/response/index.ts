/**
 * Make sure not to include any deps from our main index file. That way, we can easily publish the publin as standalone build
 */
import type { Plugin } from "../";
import Yasr from "../../";
import "./index.scss";
import type { ReadOnlyEditor, ReadOnlyEditorHandle } from "@zazuko/yasqe";
import { drawSvgStringAsElement, addClass, removeClass, drawFontAwesomeIconAsSvg } from "@zazuko/yasgui-utils";
import * as faAlignIcon from "@fortawesome/free-solid-svg-icons/faAlignLeft";
import { DeepReadonly } from "ts-essentials";
import * as imgs from "../../imgs";

export interface PluginConfig {
  maxLines: number;
}
export default class Response implements Plugin<PluginConfig> {
  private yasr: Yasr;
  label = "Response";
  priority = 2;
  helpReference = "https://vemonet.github.io/Yasgui/docs/plugins#response";
  private config: DeepReadonly<PluginConfig>;
  private overLay: HTMLDivElement | undefined;
  private container: HTMLDivElement | undefined;
  private editorHandle: ReadOnlyEditorHandle | undefined;
  private editor: ReadOnlyEditor | undefined;
  private expanded = false;
  constructor(yasr: Yasr) {
    this.yasr = yasr;
    this.config = Response.defaults;
    if (yasr.config.plugins["response"] && yasr.config.plugins["response"].dynamicConfig) {
      this.config = {
        ...this.config,
        ...yasr.config.plugins["response"].dynamicConfig,
      };
    }
  }
  // getDownloadInfo: getDownloadInfo
  canHandleResults() {
    if (!this.yasr.results) return false;
    if (!this.yasr.results.getOriginalResponseAsString) return false;
    var response = this.yasr.results.getOriginalResponseAsString();
    if ((!response || response.length == 0) && this.yasr.results.getError()) return false; //in this case, show exception instead, as we have nothing to show anyway
    return true;
  }
  public getIcon() {
    return drawSvgStringAsElement(drawFontAwesomeIconAsSvg(faAlignIcon));
  }
  download(filename?: string) {
    if (!this.yasr.results) return;
    const contentType = this.yasr.results.getContentType();
    const type = this.yasr.results.getType();
    const extension = type === "xml" ? "rdf" : type;
    return {
      getData: () => {
        return this.yasr.results?.getOriginalResponseAsString() || "";
      },
      filename: `${filename || "queryResults"}${extension ? "." + extension : ""}`,
      contentType: contentType ? contentType : "text/plain",
      title: "Download result",
    };
  }
  async draw(persistentConfig: PluginConfig) {
    const config: DeepReadonly<PluginConfig> = {
      ...this.config,
      ...persistentConfig,
    };
    const fullValue = this.getResponseString();
    const lines = fullValue.split("\n");
    const truncated = lines.length > config.maxLines;
    this.expanded = !truncated;
    const value = truncated ? lines.slice(0, config.maxLines).join("\n") : fullValue;

    const language = this.yasr.results?.getType() === "json" ? "json" : "plaintext";

    this.container = document.createElement("div");
    addClass(this.container, "yasr_response_editor");
    this.yasr.resultsEl.appendChild(this.container);

    // Build the viewer through yasqe's factory so it reuses yasqe's single monaco-vscode instance
    // (no second Monaco bundled into yasr, no duplicate-instance clash). Lazily pulls Monaco in.
    const { createReadOnlyEditor } = await import("@zazuko/yasqe");
    this.editorHandle = await createReadOnlyEditor(this.container, value, language);
    this.editor = this.editorHandle.editor;

    // Size the container to the editor content (capped when expanded so huge responses keep
    // Monaco's virtual scrolling instead of rendering one giant div).
    this.editor?.onDidContentSizeChange(() => this.fitHeight());
    this.fitHeight();

    if (truncated) this.showLess(false);
  }
  private fitHeight() {
    if (!this.editor || !this.container) return;
    const contentHeight = this.editor.getContentHeight();
    const cap = this.expanded ? Math.round(window.innerHeight * 0.7) : Infinity;
    this.container.style.height = `${Math.min(contentHeight, cap)}px`;
    this.editor.layout();
  }
  destroy() {
    this.editorHandle?.dispose();
    this.editorHandle = undefined;
    this.editor = undefined;
    this.overLay?.remove();
    this.overLay = undefined;
    this.container?.remove();
    this.container = undefined;
  }
  /**
   *
   * @param setValue Optional, if set to false the string will not update
   */
  showLess(setValue = true) {
    if (!this.editor || !this.container) return;
    this.expanded = false;
    // Add overflow
    addClass(this.container, "overflow");

    // Remove old instance
    if (this.overLay) {
      this.overLay.remove();
      this.overLay = undefined;
    }

    // Wrapper
    this.overLay = document.createElement("div");
    addClass(this.overLay, "overlay");

    // overlay content
    const overlayContent = document.createElement("div");
    addClass(overlayContent, "overlay_content");

    const showMoreButton = document.createElement("button");
    showMoreButton.title = "Show all";
    addClass(showMoreButton, "yasr_btn", "overlay_btn");
    showMoreButton.textContent = "Show all";
    showMoreButton.addEventListener("click", () => this.showMore());
    overlayContent.append(showMoreButton);

    const downloadButton = document.createElement("button");
    downloadButton.title = "Download result";
    addClass(downloadButton, "yasr_btn", "overlay_btn");

    const text = document.createElement("span");
    text.innerText = "Download result";
    downloadButton.appendChild(text);
    downloadButton.appendChild(drawSvgStringAsElement(imgs.download));
    downloadButton.addEventListener("click", () => this.yasr.download());
    downloadButton.addEventListener("keydown", (event) => {
      if (event.code === "Space" || event.code === "Enter") this.yasr.download();
    });

    overlayContent.appendChild(downloadButton);
    this.overLay.appendChild(overlayContent);
    this.container.appendChild(this.overLay);
    if (setValue) {
      this.setValue(this.limitData(this.getResponseString()));
    }
    this.fitHeight();
  }
  private limitData(value: string) {
    const lines = value.split("\n");
    if (lines.length > this.config.maxLines) {
      value = lines.slice(0, this.config.maxLines).join("\n");
    }
    return value;
  }
  /**
   * Render the raw response full length
   */
  showMore() {
    if (!this.editor || !this.container) return;
    this.expanded = true;
    removeClass(this.container, "overflow");
    this.overLay?.remove();
    this.overLay = undefined;
    this.setValue(this.getResponseString());
    this.fitHeight();
  }
  private setValue(value: string) {
    this.editor?.setValue(value);
  }
  /**
   * The string shown in the editor. JSON responses are pretty-printed with a 2-space indent;
   * anything else (and unparseable JSON) is shown verbatim.
   */
  private getResponseString(): string {
    const value = this.yasr.results?.getOriginalResponseAsString() || "";
    if (this.yasr.results?.getType() === "json") {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  }
  public static defaults: PluginConfig = {
    maxLines: 30,
  };
}
