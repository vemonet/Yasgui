import { configureDefaultWorkerFactory } from "monaco-editor-wrapper/workers/workerLoaders";
import { sparqlThemeDark, sparqlThemeLight, sparqlThemeSolarizedDark } from "./sparqlTheme";
import { sparqlTextmateGrammar, sparqlLanguageConfig } from "./sparqlGrammar";
import type { WrapperConfig } from "monaco-editor-wrapper";
import { LogLevel, Uri } from "vscode";
import LanguageServerWorker from "./languageServer.worker?worker&inline";

// https://github.com/vitejs/vite/discussions/15547

/**
 * Detects the user's preferred color scheme (light or dark)
 * @returns true if dark mode is preferred, false for light mode
 */
function prefersDarkMode(): boolean {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  // Default to light
  return false;
}

/**
 * Gets the appropriate theme configuration based on system preference
 * @returns object with theme name and VSCode theme name
 */
export function getThemeConfig() {
  if (prefersDarkMode()) {
    return {
      editorTheme: "vs-dark",
      vscodeTheme: "SPARQL Solarized Dark Theme",
    };
  } else {
    return {
      editorTheme: "vs",
      vscodeTheme: "SPARQL Custom Light Theme",
    };
  }
}

export async function buildWrapperConfig(container: HTMLElement, initial: string): Promise<WrapperConfig> {
  const workerPromise: Promise<Worker> = new Promise((resolve, reject) => {
    try {
      const instance: Worker = new LanguageServerWorker({ name: "Language Server" });
      // const instance = new Worker(new URL("./languageServer.worker.ts", import.meta.url), {
      //   name: "Language Server",
      //   type: "module",
      // });

      instance.onmessage = (event) => {
        if (event.data.type === "ready") resolve(instance);
      };
      instance.onerror = (error) => {
        console.error("Worker error:", error);
        reject(error);
      };
      // Add a timeout to prevent indefinite waiting
      setTimeout(() => {
        reject(new Error("Worker initialization timeout"));
      }, 30000); // 30 second timeout
    } catch (error) {
      console.error("Failed to create worker:", error);
      reject(error);
    }
  });
  const worker = await workerPromise;

  const extensionFilesOrContents = new Map<string, string | URL>();
  extensionFilesOrContents.set("/sparql-configuration.json", JSON.stringify(sparqlLanguageConfig));
  extensionFilesOrContents.set("/sparql-grammar.json", JSON.stringify(sparqlTextmateGrammar));
  extensionFilesOrContents.set("/sparql-theme-light.json", JSON.stringify(sparqlThemeLight));
  extensionFilesOrContents.set("/sparql-theme-dark.json", JSON.stringify(sparqlThemeDark));
  extensionFilesOrContents.set("/sparql-theme-dark-solarized.json", JSON.stringify(sparqlThemeSolarizedDark));

  // Get theme configuration based on system preference
  const themeConfig = getThemeConfig();

  // Configure the Monaco editor and LS wrapper
  const wrapperConfig: WrapperConfig = {
    $type: "extended",
    htmlContainer: container,
    logLevel: LogLevel.Debug,
    languageClientConfigs: {
      configs: {
        sparql: {
          name: "Qlue-ls",
          clientOptions: {
            documentSelector: [{ language: "sparql" }],
            workspaceFolder: {
              index: 0,
              name: "workspace",
              uri: Uri.file("/"),
            },
            progressOnInitialization: true,
            diagnosticPullOptions: {
              onChange: true,
              onSave: false,
            },
          },
          connection: {
            options: {
              $type: "WorkerDirect",
              worker: worker,
            },
          },
          restartOptions: {
            retries: 5,
            timeout: 1000,
            keepWorker: true,
          },
        },
      },
    },
    editorAppConfig: {
      codeResources: {
        modified: {
          uri: "query.rq",
          text: initial,
        },
      },
      monacoWorkerFactory: configureDefaultWorkerFactory,
      editorOptions: {
        tabCompletion: "on",
        suggestOnTriggerCharacters: true,
        theme: themeConfig.editorTheme,
        fontSize: 14,
        fontFamily: "Source Code Pro",
        links: false,
        minimap: {
          enabled: false,
        },
        overviewRulerLanes: 0,
        scrollBeyondLastLine: false,
        padding: {
          top: 10,
          bottom: 10,
        },
      },
    },
    vscodeApiConfig: {
      userConfiguration: {
        json: JSON.stringify({
          "workbench.colorTheme": themeConfig.vscodeTheme,
          "editor.guides.bracketPairsHorizontal": "active",
          "editor.lightbulb.enabled": "On",
          "editor.wordBasedSuggestions": "off",
          "editor.experimental.asyncTokenization": true,
          "editor.tabSize": 2,
          "editor.insertSpaces": true,
          "editor.detectIndentation": false,
        }),
      },
    },

    extensions: [
      {
        config: {
          name: "langium-sparql",
          publisher: "Ioannis Nezis",
          version: "1.0.0",
          engines: {
            vscode: "*",
          },
          contributes: {
            languages: [
              {
                id: "sparql",
                extensions: [".rq", ".sparql"],
                aliases: ["sparql", "SPARQL"],
                configuration: "/sparql-configuration.json",
              },
            ],
            themes: [
              {
                id: "vs-dark",
                label: "SPARQL Solarized Dark Theme",
                uiTheme: "vs-dark",
                path: "./sparql-theme-dark-solarized.json",
              },
              {
                id: "custom-dark",
                label: "SPARQL Custom Dark Theme",
                uiTheme: "vs-dark",
                path: "./sparql-theme-dark.json",
              },
              {
                id: "vs",
                label: "SPARQL Custom Light Theme",
                uiTheme: "vs",
                path: "./sparql-theme-light.json",
              },
            ],
            grammars: [
              {
                language: "sparql",
                scopeName: "source.sparql",
                path: "/sparql-grammar.json",
              },
            ],
          },
        },
        filesOrContents: extensionFilesOrContents,
      },
    ],
  };
  return wrapperConfig;
}

// // TODO: Uncomment and check to support live theme changes
// /**
//  * Sets up a listener for system theme changes
//  * @param callback Function to call when theme changes, receives the new theme config
//  * @returns Function to remove the listener
//  */
// export function setupThemeChangeListener(callback: (themeConfig: ReturnType<typeof getThemeConfig>) => void): () => void {
//   if (typeof window === 'undefined' || !window.matchMedia) {
//     // Return a no-op function if matchMedia is not available
//     return () => {};
//   }
//   const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//   const handleChange = () => {
//     callback(getThemeConfig());
//   };
//   // Use the modern addEventListener if available, fallback to addListener
//   if (mediaQuery.addEventListener) {
//     mediaQuery.addEventListener('change', handleChange);
//     return () => mediaQuery.removeEventListener('change', handleChange);
//   } else if (mediaQuery.addListener) {
//     mediaQuery.addListener(handleChange);
//     return () => mediaQuery.removeListener(handleChange);
//   }
//   return () => {};
// }
