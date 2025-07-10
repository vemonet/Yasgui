import { EventEmitter } from "events";
import { eq, mergeWith } from "lodash-es";

import { addClass, removeClass, getAsValue } from "@sib-swiss/yasgui-utils";
import { default as Yasqe, PlainRequestConfig } from "@sib-swiss/yasqe";
import { Parser, PersistentConfig as YasrPersistentConfig } from "@sib-swiss/yasr";
import { TabListEl } from "./TabElements";
import TabPanel from "./TabPanel";
import * as shareLink from "./linkUtils";
import EndpointSelect from "./endpointSelect";
import "./style/tab.css";
import { getRandomId, default as Yasgui, YasguiRequestConfig } from "./";

export interface PersistedJsonYasr extends YasrPersistentConfig {
  responseSummary: Parser.ResponseSummary;
}

export interface PersistedJson {
  name: string;
  id: string;
  yasqe: {
    value: string;
    editorHeight?: string;
  };
  yasr: {
    settings: YasrPersistentConfig;
    response: Parser.ResponseSummary | undefined;
  };
  requestConfig: YasguiRequestConfig;
}

export interface Tab {
  on(event: string | symbol, listener: (...args: any[]) => void): this;

  on(event: "change", listener: (tab: Tab, config: PersistedJson) => void): this;
  emit(event: "change", tab: Tab, config: PersistedJson): boolean;
  on(event: "query", listener: (tab: Tab) => void): this;
  emit(event: "query", tab: Tab): boolean;
  on(event: "queryBefore", listener: (tab: Tab) => void): this;
  emit(event: "queryBefore", tab: Tab): boolean;
  on(event: "queryAbort", listener: (tab: Tab) => void): this;
  emit(event: "queryAbort", tab: Tab): boolean;
  on(event: "queryResponse", listener: (tab: Tab) => void): this;
  emit(event: "queryResponse", tab: Tab): boolean;
  on(event: "close", listener: (tab: Tab) => void): this;
  emit(event: "close", tab: Tab): boolean;
  on(event: "endpointChange", listener: (tab: Tab, endpoint: string) => void): this;
  emit(event: "endpointChange", tab: Tab, endpoint: string): boolean;
  on(event: "autocompletionShown", listener: (tab: Tab, widget: any) => void): this;
  emit(event: "autocompletionShown", tab: Tab, widget: any): boolean;
  on(event: "autocompletionClose", listener: (tab: Tab) => void): this;
  emit(event: "autocompletionClose", tab: Tab): boolean;
}

export class Tab extends EventEmitter {
  private persistentJson: PersistedJson;
  public yasgui: Yasgui;
  private rootEl: HTMLDivElement | undefined;
  private controlBarEl: HTMLDivElement | undefined;
  private yasqeWrapperEl: HTMLDivElement | undefined;
  private yasrWrapperEl: HTMLDivElement | undefined;
  private endpointSelect: EndpointSelect | undefined;
  private tabPanel: TabPanel | undefined;

  constructor(yasgui: Yasgui, conf: PersistedJson) {
    super();
    if (!conf || conf.id === undefined) throw new Error("Expected a valid configuration to initialize tab with");
    this.yasgui = yasgui;
    this.persistentJson = conf;
  }

  public name() {
    return this.persistentJson.name;
  }
  public getPersistedJson() {
    return this.persistentJson;
  }
  public getId() {
    return this.persistentJson.id;
  }
  private draw() {
    if (this.rootEl) return; //aready drawn
    this.rootEl = document.createElement("div");
    this.rootEl.className = "tabPanel";
    this.rootEl.id = this.persistentJson.id;
    this.rootEl.setAttribute("role", "tabpanel");
    this.rootEl.setAttribute("aria-labelledby", "tab-" + this.persistentJson.id);

    // We group controlbar and Yasqe, so that users can easily .appendChild() to the .editorwrapper div
    // to add a div that goes alongside the controlbar and editor, while YASR still goes full width
    // Useful for adding an infos div that goes alongside the editor without needing to rebuild the whole Yasgui class
    const editorWrapper = document.createElement("div");
    editorWrapper.className = "editorwrapper";
    const controlbarAndYasqeDiv = document.createElement("div");
    //controlbar
    this.controlBarEl = document.createElement("div");
    this.controlBarEl.className = "controlbar";
    controlbarAndYasqeDiv.appendChild(this.controlBarEl);

    //yasqe
    this.yasqeWrapperEl = document.createElement("div");
    controlbarAndYasqeDiv.appendChild(this.yasqeWrapperEl);
    editorWrapper.appendChild(controlbarAndYasqeDiv);

    //yasr
    this.yasrWrapperEl = document.createElement("div");

    this.initTabSettingsMenu();
    this.rootEl.appendChild(editorWrapper);
    this.rootEl.appendChild(this.yasrWrapperEl);
    this.initControlbar();
    this.initYasqe();
    this.initYasr();
    this.yasgui._setPanel(this.persistentJson.id, this.rootEl);
  }
  public hide() {
    removeClass(this.rootEl, "active");
  }
  public show() {
    this.draw();
    addClass(this.rootEl, "active");
    this.yasgui.tabElements.selectTab(this.persistentJson.id);

    // Move global YASQE and YASR instances to this tab and update their content
    if (this.yasqeWrapperEl && this.yasrWrapperEl) {
      this.yasgui.syncEditorsWithTab(this, this.yasqeWrapperEl, this.yasrWrapperEl);
    }

    const yasr = this.getYasr();
    if (yasr) yasr.refresh();
    // Refresh, as other tabs might have changed the endpoint history
    this.setEndpoint(this.getEndpoint(), this.yasgui.persistentConfig.getEndpointHistory());
  }
  public select() {
    this.yasgui.selectTabId(this.persistentJson.id);
  }
  public close() {
    const yasqe = this.getYasqe();
    if (yasqe) yasqe.abortQuery();
    if (this.yasgui.getTab() === this) {
      // It's the active tab, first select other tab
      const tabs = this.yasgui.persistentConfig.getTabs();
      const i = tabs.indexOf(this.persistentJson.id);
      if (i > -1) {
        this.yasgui.selectTabId(tabs[i === tabs.length - 1 ? i - 1 : i + 1]);
      }
    }
    this.yasgui._removePanel(this.rootEl);
    this.yasgui.persistentConfig.deleteTab(this.persistentJson.id);
    this.yasgui.emit("tabClose", this.yasgui, this);
    this.emit("close", this);
    this.yasgui.tabElements.get(this.persistentJson.id).delete();
    delete this.yasgui._tabs[this.persistentJson.id];
  }
  public getQuery() {
    if (!this.getYasqe()) throw new Error("Cannot get value from uninitialized editor");
    return this.getYasqe()?.getValue();
  }
  public setQuery(query: string) {
    if (!this.getYasqe()) throw new Error("Cannot set value for uninitialized editor");
    this.getYasqe()?.setValue(query);
    this.persistentJson.yasqe.value = query;
    this.emit("change", this, this.persistentJson);
    return this;
  }
  public getRequestConfig() {
    return this.persistentJson.requestConfig;
  }

  private initControlbar() {
    this.initEndpointSelectField();
    if (this.yasgui.config.endpointInfo && this.controlBarEl) {
      this.controlBarEl.appendChild(this.yasgui.config.endpointInfo());
    }
  }
  public getYasqe() {
    return this.yasgui.yasqe;
  }
  public getYasr() {
    return this.yasgui.yasr;
  }
  private initTabSettingsMenu() {
    if (!this.rootEl || !this.controlBarEl)
      throw new Error("Need to initialize wrapper elements before drawing tab pabel");
    this.tabPanel = new TabPanel(this, this.rootEl, this.controlBarEl);
  }

  private initEndpointSelectField() {
    if (!this.controlBarEl) throw new Error("Need to initialize wrapper elements before drawing endpoint field");
    this.endpointSelect = new EndpointSelect(
      this.getEndpoint(),
      this.controlBarEl,
      this.yasgui.config.endpointCatalogueOptions,
      this.yasgui.persistentConfig.getEndpointHistory()
    );
    this.endpointSelect.on("select", (endpoint, endpointHistory) => {
      this.setEndpoint(endpoint, endpointHistory);
    });
    this.endpointSelect.on("remove", (endpoint, endpointHistory) => {
      this.setEndpoint(endpoint, endpointHistory);
    });
  }

  private checkEndpointForCors(endpoint: string) {
    if (this.yasgui.config.corsProxy && !(endpoint in Yasgui.corsEnabled)) {
      const askUrl = new URL(endpoint);
      askUrl.searchParams.append("query", "ASK {?x ?y ?z}");
      fetch(askUrl.toString())
        .then(() => {
          Yasgui.corsEnabled[endpoint] = true;
        })
        .catch((e) => {
          // CORS error throws `TypeError: NetworkError when attempting to fetch resource.`
          Yasgui.corsEnabled[endpoint] = e instanceof TypeError ? false : true;
        });
    }
  }
  public setEndpoint(endpoint: string, endpointHistory?: string[]) {
    if (endpoint) endpoint = endpoint.trim();
    if (endpointHistory && !eq(endpointHistory, this.yasgui.persistentConfig.getEndpointHistory())) {
      this.yasgui.emit("endpointHistoryChange", this.yasgui, endpointHistory);
    }
    this.checkEndpointForCors(endpoint); //little cost in checking this as we're caching the check results

    if (this.persistentJson.requestConfig.endpoint !== endpoint) {
      this.persistentJson.requestConfig.endpoint = endpoint;
      this.emit("change", this, this.persistentJson);
      this.emit("endpointChange", this, endpoint);
      // Endpoint metadata is handled by the parent Yasgui instance through the endpointChange event
    }
    if (this.endpointSelect instanceof EndpointSelect) {
      this.endpointSelect.setEndpoint(endpoint, endpointHistory);
    }
    return this;
  }
  public getEndpoint(): string {
    return getAsValue(this.persistentJson.requestConfig.endpoint, this.yasgui);
  }
  /**
   * Updates the position of the Tab's contextmenu
   * Useful for when being scrolled
   */
  public updateContextMenu(): void {
    this.getTabListEl().redrawContextMenu();
  }
  public getShareableLink(baseURL?: string): string {
    return shareLink.createShareLink(baseURL || window.location.href, this);
  }
  public getShareObject() {
    return shareLink.createShareConfig(this);
  }
  private getTabListEl(): TabListEl {
    return this.yasgui.tabElements.get(this.persistentJson.id);
  }
  public setName(newName: string) {
    this.getTabListEl().rename(newName);
    this.persistentJson.name = newName;
    this.emit("change", this, this.persistentJson);
    return this;
  }
  public hasResults() {
    return !!this.getYasr()?.results;
  }

  public getName() {
    return this.persistentJson.name;
  }
  public query(): Promise<any> {
    const yasqe = this.getYasqe();
    if (!yasqe) return Promise.reject(new Error("No yasqe editor initialized"));
    return yasqe.query();
  }
  public setRequestConfig(requestConfig: Partial<YasguiRequestConfig>) {
    this.persistentJson.requestConfig = {
      ...this.persistentJson.requestConfig,
      ...requestConfig,
    };

    this.emit("change", this, this.persistentJson);
  }

  /**
   * The Yasgui configuration object may contain a custom request config
   * This request config object can contain getter functions, or plain json
   * The plain json data is stored in persisted config, and editable via the
   * tab pane.
   * The getter functions are not. This function is about fetching this part of the
   * request configuration, so we can merge this with the configuration from the
   * persistent config and tab pane.
   *
   * Considering some values will never be persisted (things that should always be a function),
   * we provide that as part of a whitelist called `keepDynamic`
   */
  private getStaticRequestConfig() {
    const config: Partial<PlainRequestConfig> = {};
    let key: keyof YasguiRequestConfig;
    for (key in this.yasgui.config.requestConfig) {
      //This config option should never be static or persisted anyway
      if (key === "adjustQueryBeforeRequest") continue;
      const val = this.yasgui.config.requestConfig[key];
      if (typeof val === "function") {
        (config[key] as any) = val(this.yasgui);
      }
    }
    return config;
  }

  private initYasqe() {
    // No longer create YASQE instance here, it's created globally in Yasgui
    // This method now just stores the configuration that would be used when the global YASQE is updated for this tab

    if (!this.yasqeWrapperEl) throw new Error("Expected a wrapper element before setting up yasqe configuration");

    // The configuration will be used by updateYasqeForTab in the Yasgui class
    // No need to create instance or bind events here since global instance handles it
  }
  public handleYasqeBlur = (yasqe: Yasqe) => {
    this.persistentJson.yasqe.value = yasqe.getValue();
    this.emit("change", this, this.persistentJson);
  };
  public handleYasqeQuery = (yasqe: Yasqe) => {
    //the blur event might not have fired (e.g. when pressing ctrl-enter). So, we'd like to persist the query as well if needed
    if (typeof yasqe.getValue === "function" && yasqe.getValue() !== this.persistentJson.yasqe.value) {
      this.persistentJson.yasqe.value = yasqe.getValue();
      this.emit("change", this, this.persistentJson);
    }
    this.emit("query", this);
  };
  public handleYasqeQueryAbort = () => {
    this.emit("queryAbort", this);
  };
  public handleYasqeQueryBefore = () => {
    this.emit("queryBefore", this);
  };
  public handleYasqeResize = (_yasqe: Yasqe, newSize: string) => {
    this.persistentJson.yasqe.editorHeight = newSize;
    this.emit("change", this, this.persistentJson);
  };
  public handleAutocompletionShown = (_yasqe: Yasqe, widget: string) => {
    this.emit("autocompletionShown", this, widget);
  };
  public handleAutocompletionClose = (_yasqe: Yasqe) => {
    this.emit("autocompletionClose", this);
  };
  public handleQueryResponse = (response: any, duration: number) => {
    this.emit("queryResponse", this);
    const yasr = this.getYasr();
    if (!yasr) throw new Error("Resultset visualizer not initialized. Cannot draw results");
    yasr.setResponse(response, duration);
    if (!yasr.results) return;
    if (!yasr.results.hasError()) {
      this.persistentJson.yasr.response = yasr.results.getAsStoreObject(
        this.yasgui.config.yasr.maxPersistentResponseSize
      );
    } else {
      // Don't persist if there is an error and remove the previous result
      this.persistentJson.yasr.response = undefined;
    }
    this.emit("change", this, this.persistentJson);
  };

  /**
   * Get the processed request configuration for this tab
   * This is used by the global YASQE instance
   */
  public getProcessedRequestConfig(): YasguiRequestConfig {
    const processedReqConfig: YasguiRequestConfig = {
      //setting defaults
      //@ts-ignore
      acceptHeaderGraph: "text/turtle",
      //@ts-ignore
      acceptHeaderSelect: "application/sparql-results+json",
      ...mergeWith(
        {},
        this.persistentJson.requestConfig,
        this.getStaticRequestConfig(),
        function customizer(objValue, srcValue) {
          if (Array.isArray(objValue) || Array.isArray(srcValue)) {
            return [...(objValue || []), ...(srcValue || [])];
          }
        }
      ),
      //Passing this manually. Dont want to use our own persistentJson, as that's flattened exclude functions
      //The adjustQueryBeforeRequest is meant to be a function though, so let's copy that as is
      adjustQueryBeforeRequest: this.yasgui.config.requestConfig.adjustQueryBeforeRequest,
    };
    if (this.yasgui.config.corsProxy && !Yasgui.corsEnabled[this.getEndpoint()]) {
      return {
        ...processedReqConfig,
        args: [
          ...(Array.isArray(processedReqConfig.args) ? processedReqConfig.args : []),
          { name: "endpoint", value: this.getEndpoint() },
          { name: "method", value: this.persistentJson.requestConfig.method },
        ],
        method: "POST",
        endpoint: this.yasgui.config.corsProxy,
      } as PlainRequestConfig;
    }
    return processedReqConfig as PlainRequestConfig;
  }

  /**
   * Handle YASR change events
   * This method is called by the global YASR instance
   */
  public handleYasrChange(yasr: any) {
    if (yasr) {
      this.persistentJson.yasr.settings = yasr.getPersistentConfig();
    }
    this.emit("change", this, this.persistentJson);
  }

  private initYasr() {
    // No longer create YASR instance here, it's created globally in Yasgui
    // This method now just stores the configuration that would be used
    // when the global YASR is updated for this tab
    if (!this.yasrWrapperEl) throw new Error("Wrapper for yasr does not exist");
    // The configuration will be used by updateYasrForTab in the Yasgui class
    // No need to create instance or bind events here since global instance handles it
  }

  destroy() {
    // this.removeAllListeners();
    // this.tabPanel?.destroy();
    // this.endpointSelect?.destroy();
    // this.endpointSelect = undefined;
    // this.yasr?.destroy();
    // this.yasr = undefined;
    // this.destroyYasqe();
  }

  public static getDefaults(yasgui?: Yasgui): PersistedJson {
    return {
      yasqe: {
        value: yasgui ? yasgui.config.yasqe.value || "" : Yasgui.defaults.yasqe.value || "",
      },
      yasr: {
        response: undefined,
        settings: {
          selectedPlugin: yasgui ? yasgui.config.yasr.defaultPlugin : "table",
          pluginsConfig: {},
        },
      },
      requestConfig: yasgui ? yasgui.config.requestConfig : { ...Yasgui.defaults.requestConfig },
      id: getRandomId(),
      name: yasgui ? yasgui.createTabName() : Yasgui.defaults.tabName,
    };
  }
}

export default Tab;
