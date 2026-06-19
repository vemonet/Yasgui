/// <reference types="vite/client" />
import QlueLsWorker from "./qluels.worker?worker";
import SwlsWorker from "./swls.worker?worker";
import TraqulaWorker from "./traqula.worker?worker";

/**
 * Create a qlue-ls language-server worker and resolve once its WASM is initialized.
 * Pass the result to Yasqe/Yasgui as a language server's `worker` in the `languageServers` config.
 */
export function createQlueLsWorker(): Promise<Worker> {
  return new Promise((resolve) => {
    const worker = new QlueLsWorker({ name: "qlue-ls" });
    worker.onmessage = (event) => {
      if (event.data?.type === "ready") resolve(worker);
    };
  });
}

/**
 * Create an swls language-server worker and resolve once its WASM is loaded and it signals
 * readiness. Waiting avoids racing the language client's initialize/didOpen burst against the
 * WASM import (which broke message ordering and left semantic-token highlighting unapplied).
 */
export function createSwlsWorker(): Promise<Worker> {
  return new Promise((resolve) => {
    const worker = new SwlsWorker({ name: "swls" });
    worker.onmessage = (event) => {
      if (event.data?.type === "ready") resolve(worker);
    };
  });
}

/**
 * Create a Traqula language-server worker (pure-JS SPARQL 1.2 parser) and resolve once it signals
 * readiness with a "ready" message.
 */
export function createTraqulaWorker(): Promise<Worker> {
  return new Promise((resolve) => {
    const worker = new TraqulaWorker({ name: "traqula-ls" });
    worker.onmessage = (event) => {
      if (event.data === "ready") resolve(worker);
    };
  });
}

/** Default SPARQL endpoint used across the demo pages. */
export const DEMO_ENDPOINT = "https://sparql.dblp.org/sparql";

export type DevTheme = "light" | "dark";

/**
 * Wire the demo page's light/dark switcher: start from the OS preference, and on toggle set the
 * `[data-theme]` attribute (which drives the CSS) and call `onThemeChange` (e.g. editor.setTheme).
 */
export function setupThemeToggle(onThemeChange?: (theme: DevTheme) => void): DevTheme {
  let currentTheme: DevTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = currentTheme;
  const button = document.getElementById("darkModeToggle");
  const render = () => {
    if (!button) return;
    button.textContent = currentTheme === "dark" ? "☀️" : "🌙";
    const title = currentTheme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    button.setAttribute("title", title);
    button.setAttribute("aria-label", title);
  };
  render();
  button?.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = currentTheme;
    render();
    onThemeChange?.(currentTheme);
  });
  return currentTheme;
}
