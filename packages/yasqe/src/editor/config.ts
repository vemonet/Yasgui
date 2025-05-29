import languageServerWorkerUrl from "./languageServer.worker?worker&url";
import { configureDefaultWorkerFactory } from "monaco-editor-wrapper/workers/workerLoaders";
import { sparqlTextmateGrammar, sparqlLanguageConfig, sparqlTheme } from "./sparqlTheme";
import type { WrapperConfig } from "monaco-editor-wrapper";
import { LogLevel, Uri } from "vscode";

export async function buildWrapperConfig(container: HTMLElement, initial: string): Promise<WrapperConfig> {
  // Use the external worker file instead of creating from blob
  const workerPromise: Promise<Worker> = new Promise((resolve, reject) => {
    try {
      // const instance = new Worker(new URL("./languageServer.worker.ts", import.meta.url), {
      const instance = new Worker(new URL(languageServerWorkerUrl, window.location.origin), {
        name: "Language Server",
        type: "module",
      });

      instance.onmessage = (event) => {
        if (event.data.type === "ready") {
          resolve(instance);
        }
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
  extensionFilesOrContents.set("/sparql-theme.json", JSON.stringify(sparqlTheme));

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
        theme: "vs-dark",
        fontSize: 16,
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
          "workbench.colorTheme": "SPARQL Custom Theme",
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
                extensions: [".rq"],
                aliases: ["sparql", "SPARQL"],
                configuration: "/sparql-configuration.json",
              },
            ],
            themes: [
              {
                // id: "dark-sparql-theme",
                label: "SPARQL Custom Theme",
                uiTheme: "vs-dark",
                path: "./sparql-theme.json",
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
