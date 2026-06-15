import { Storage as YStorage } from "@zazuko/yasgui-utils";
import Yasgui from "./";
import * as Tab from "./Tab";
export var storageNamespace = "triply";
export interface PersistedJson {
  endpointHistory: string[];
  tabs: string[];
  active: string | undefined;
  tabConfig: { [tabId: string]: Tab.PersistedJson };
  lastClosedTab: { index: number; tab: Tab.PersistedJson } | undefined;
  /** Preferred language server label per endpoint URL, so the right one is restored per endpoint. */
  languageServerByEndpoint: { [endpoint: string]: string };
}
function getDefaults(): PersistedJson {
  return {
    endpointHistory: [],
    tabs: [],
    active: undefined,
    tabConfig: {},
    lastClosedTab: undefined,
    languageServerByEndpoint: {},
  };
}

export default class PersistentConfig {
  private persistedJson!: PersistedJson;
  private storageId: string | undefined;
  private yasgui: Yasgui;
  private storage: YStorage;
  constructor(yasgui: Yasgui) {
    this.yasgui = yasgui;
    this.storageId = this.yasgui.getStorageId(this.yasgui.config.persistenceLabelConfig);
    this.storage = new YStorage(storageNamespace);
    this.fromStorage();
    this.registerListeners();
  }

  public setActive(id: string) {
    this.persistedJson.active = id;
    this.toStorage();
  }
  public getActiveId(): string | undefined {
    return this.persistedJson.active;
  }
  public addToTabList(tabId: string, index?: number) {
    if (index !== undefined && this.persistedJson.tabs.length > index) {
      this.persistedJson.tabs.splice(index, 0, tabId);
    } else {
      this.persistedJson.tabs.push(tabId);
    }

    this.toStorage();
  }
  public setTabOrder(tabs: string[]) {
    this.persistedJson.tabs = tabs;
    this.toStorage();
  }
  public getEndpointHistory() {
    return this.persistedJson.endpointHistory;
  }
  /** The language server label the user last picked for this endpoint, if any. */
  public getLanguageServerForEndpoint(endpoint: string): string | undefined {
    return this.persistedJson.languageServerByEndpoint[endpoint];
  }
  /** Remember the language server label chosen for this endpoint and persist it. */
  public setLanguageServerForEndpoint(endpoint: string, label: string) {
    if (!endpoint || !label) return;
    if (this.persistedJson.languageServerByEndpoint[endpoint] === label) return;
    this.persistedJson.languageServerByEndpoint[endpoint] = label;
    this.toStorage();
  }
  public retrieveLastClosedTab() {
    const tabCopy = this.persistedJson.lastClosedTab;
    if (tabCopy === undefined) return tabCopy;
    this.persistedJson.lastClosedTab = undefined;
    return tabCopy;
  }
  public hasLastClosedTab() {
    return !!this.persistedJson.lastClosedTab;
  }
  public deleteTab(tabId: string) {
    const i = this.persistedJson.tabs.indexOf(tabId);
    if (i > -1) {
      this.persistedJson.tabs.splice(i, 1);
    }
    if (this.tabIsActive(tabId)) {
      this.persistedJson.active = undefined;
    }
    this.persistedJson.lastClosedTab = { index: i, tab: this.persistedJson.tabConfig[tabId] };
    delete this.persistedJson.tabConfig[tabId];
    this.toStorage();
  }
  private registerListeners() {
    this.yasgui.on("tabChange", (_yasgui, tab) => {
      this.persistedJson.tabConfig[tab.getId()] = tab.getPersistedJson();
      this.toStorage();
    });
    this.yasgui.on("endpointHistoryChange", (_yasgui, history) => {
      this.persistedJson.endpointHistory = history;
      this.toStorage();
    });
  }

  private toStorage() {
    this.storage.set(
      this.storageId,
      this.persistedJson,
      this.yasgui.config.persistencyExpire,
      this.handleLocalStorageQuotaFull,
    );
  }
  private fromStorage(): PersistedJson {
    this.persistedJson = this.storage.get<PersistedJson>(this.storageId) || getDefaults();
    /**
     * Modify some settings for backwards compatability
     */
    if (!this.persistedJson.endpointHistory) {
      this.persistedJson.endpointHistory = [];
    }
    if (!this.persistedJson.languageServerByEndpoint) {
      this.persistedJson.languageServerByEndpoint = {};
    }
    return this.persistedJson;
  }

  private handleLocalStorageQuotaFull(_e: any) {
    console.warn("Localstorage quota exceeded. Clearing all YASGUI configurations");
    PersistentConfig.clear();
  }

  public getTabs() {
    return this.persistedJson.tabs;
  }
  public getTab(tabId: string) {
    return this.persistedJson.tabConfig[tabId];
  }

  /**
   * We shouldnt normally need this (as this object simply listens to tab change events)
   * Only exception is when we're loading a tab config from the url
   * Then we'd like to forward that config to this object, so we can simply keep initializing from this persistence class
   */
  public setTab(tabId: string, tabConfig: Tab.PersistedJson) {
    this.persistedJson.tabs.push(tabId);
    this.persistedJson.tabConfig[tabId] = tabConfig;
    this.persistedJson.active = tabId;
  }
  public tabIsActive(tabId: string) {
    return tabId === this.persistedJson.active;
  }
  public currentId() {
    return this.persistedJson.active;
  }
  public static clear() {
    const storage = new YStorage(storageNamespace);
    storage.removeNamespace();
  }
}
