/**
 * Monaco Editor setup with SPARQL language support and qlue-ls language server
 */

import {
  configureDefaultWorkerFactory,
  // useWorkerFactory,
  // Worker as WorkerWrapper,
  // type WorkerLoader,
} from "monaco-languageclient/workerFactory";
import { type EditorAppConfig, EditorApp } from "monaco-languageclient/editorApp";
import { type MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from "monaco-languageclient/vscodeApiWrapper";
import { type LanguageClientConfig, LanguageClientWrapper } from "monaco-languageclient/lcwrapper";
import { Uri } from "monaco-editor";

// // Worker constructors - use ?worker to get constructors that work with Vite bundling
// import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
// import TextMateWorker from "@codingame/monaco-vscode-textmate-service-override/worker?worker";
// // Using Worker URL
// import editorWorkerUrl from "monaco-editor/esm/vs/editor/editor.worker?worker&url";
// import TextMateWorkerUrl from "@codingame/monaco-vscode-textmate-service-override/worker?worker&url";

import languageServerWorker from "./languageServer.worker?worker";

// Import SPARQL theme and grammar for syntax highlighting
import { sparqlThemeDark, sparqlThemeLight } from "./sparqlTheme";
import { sparqlTextmateGrammar, sparqlLanguageConfig } from "./sparqlGrammar";

export interface MonacoEditorResult {
  apiWrapper: MonacoVscodeApiWrapper;
  editorApp: EditorApp;
  languageClient: LanguageClientWrapper;
  getContent(): string;
  setContent(content: string): void;
  focus(): void;
  getDocumentUri(): string;
}

/**
 * Creates a Monaco editor with SPARQL syntax highlighting and qlue-ls language server
 */
export async function startMonacoEditor(
  container: HTMLElement,
  initialValue: string,
  theme: "light" | "dark" = "dark"
): Promise<MonacoEditorResult> {
  // Load the language server worker first
  const lsWorker = await loadLanguageServerWorker();

  // Worker loaders for Monaco - use worker constructors directly
  // The workers are instantiated at runtime by the monacoWorkerFactory callback
  // Cast to any to bypass WorkerLoader type which expects monaco-languageclient Worker wrapper
  // const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  //   TextEditorWorker: () => new EditorWorker() as any,
  //   TextMateWorker: () => new TextMateWorker() as any,
  // };
  // // Using worker URLs
  // const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  //   TextEditorWorker: () => new WorkerWrapper(editorWorkerUrl),
  //   TextMateWorker: () => new WorkerWrapper(TextMateWorkerUrl),
  // };

  // Extension files for SPARQL language support
  const extensionFilesOrContents = new Map<string, string | URL>();
  extensionFilesOrContents.set("/sparql-configuration.json", JSON.stringify(sparqlLanguageConfig));
  extensionFilesOrContents.set("/sparql-grammar.json", JSON.stringify(sparqlTextmateGrammar));
  extensionFilesOrContents.set("/sparql-theme-light.json", JSON.stringify(sparqlThemeLight));
  extensionFilesOrContents.set("/sparql-theme-dark.json", JSON.stringify(sparqlThemeDark));

  // MonacoVscodeApiConfig
  const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: "extended",
    viewsConfig: {
      $type: "EditorService",
    },
    userConfiguration: {
      json: JSON.stringify({
        "workbench.colorTheme": theme === "dark" ? "SPARQL Dark Theme" : "SPARQL Light Theme",
        "editor.guides.bracketPairsHorizontal": "active",
        "editor.lightbulb.enabled": "On",
        "editor.wordBasedSuggestions": "off",
        "editor.experimental.asyncTokenization": true,
        "editor.tabSize": 2,
        "editor.insertSpaces": true,
        "editor.detectIndentation": false,
        "editor.fontSize": 14,
        "editor.minimap.enabled": false,
        "files.eol": "\n",
      }),
    },
    // Worker factory callback - called by MonacoVscodeApiWrapper at the right time
    // This ensures MonacoEnvironment.getWorker is set up before Monaco needs workers
    // monacoWorkerFactory: () => {
    //   useWorkerFactory({ workerLoaders });
    // },
    monacoWorkerFactory: configureDefaultWorkerFactory,
    extensions: [
      {
        config: {
          name: "sparql-language",
          publisher: "Ioannis Nezis",
          version: "1.0.0",
          engines: { vscode: "*" },
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
                id: "SPARQL Light Theme",
                label: "SPARQL Light Theme",
                uiTheme: "vs",
                path: "./sparql-theme-light.json",
              },
              {
                id: "SPARQL Dark Theme",
                label: "SPARQL Dark Theme",
                uiTheme: "vs-dark",
                path: "./sparql-theme-dark.json",
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

  // Language client configuration for qlue-ls
  const languageClientConfig: LanguageClientConfig = {
    languageId: "sparql",
    clientOptions: {
      documentSelector: [{ language: "sparql" }],
      workspaceFolder: {
        index: 0,
        name: "workspace",
        uri: Uri.parse("file:/"),
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
        worker: lsWorker,
      },
    },
    restartOptions: {
      retries: 5,
      timeout: 1000,
      keepWorker: false,
    },
  };

  // EditorAppConfig
  const editorAppConfig: EditorAppConfig = {
    codeResources: {
      modified: {
        uri: "query.rq",
        text: initialValue,
      },
    },
    editorOptions: {
      tabCompletion: "on",
      suggestOnTriggerCharacters: true,
      fontSize: 14,
      fontFamily: "Source Code Pro, monospace",
      links: false,
      minimap: { enabled: false },
      overviewRulerLanes: 0,
      scrollBeyondLastLine: false,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
      },
      padding: { top: 8, bottom: 8 },
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 2,
      glyphMargin: true,
      contextmenu: false,
      folding: true,
      foldingImportsByDefault: true,
      snippetSuggestions: "top",
      tabSize: 2,
    },
  };

  // Create and start the monaco-vscode api wrapper
  const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
  await apiWrapper.start();

  // Create and start the language client wrapper
  const lcWrapper = new LanguageClientWrapper(languageClientConfig);
  await lcWrapper.start();
  // const languageClient = lcWrapper.getLanguageClient();

  // Create and start the editor app
  const editorApp = new EditorApp(editorAppConfig);
  await editorApp.start(container);

  return {
    apiWrapper,
    editorApp,
    languageClient: lcWrapper,
    getContent(): string {
      return editorApp.getEditor()?.getValue() ?? "";
    },
    setContent(content: string): void {
      editorApp.getEditor()?.setValue(content);
    },
    focus(): void {
      editorApp.getEditor()?.focus();
    },
    getDocumentUri(): string {
      return editorApp.getEditor()?.getModel()?.uri.toString() ?? "";
    },
  };
}

/**
 * Load the language server worker and wait for it to be ready
 */
function loadLanguageServerWorker(): Promise<Worker> {
  return new Promise((resolve) => {
    const instance: Worker = new languageServerWorker({ name: "Language Server" });
    instance.onmessage = (event) => {
      if (event.data.type === "ready") {
        resolve(instance);
      }
    };
  });
}
