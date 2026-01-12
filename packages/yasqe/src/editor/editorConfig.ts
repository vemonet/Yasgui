/**
 * Monaco Editor setup with SPARQL language support and qlue-ls language server
 */

import { configureDefaultWorkerFactory } from "monaco-languageclient/workerFactory";
import { type EditorAppConfig, EditorApp } from "monaco-languageclient/editorApp";
import { type MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from "monaco-languageclient/vscodeApiWrapper";
import { type LanguageClientConfig, LanguageClientWrapper } from "monaco-languageclient/lcwrapper";
import { Uri } from "monaco-editor";

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
  // Load the language server worker
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
    // Use configureDefaultWorkerFactory to set up Monaco workers
    // This uses new URL() with import.meta.url internally
    monacoWorkerFactory: configureDefaultWorkerFactory,
    // Worker factory already initialized at the start of startMonacoEditor
    // Setting to undefined lets the early useWorkerFactory call handle it
    // monacoWorkerFactory: () => workersFactory,
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

  // Create and start the editor app
  const editorApp = new EditorApp(editorAppConfig);
  await editorApp.start(container);

  // // TODO: workaround trigger re-tokenization after a short delay to ensure syntax highlighting
  // const editor = editorApp.getEditor();
  // if (editor) {
  //   setTimeout(() => {
  //     const model = editor.getModel();
  //     if (model) {
  //       // Force a model content change to trigger re-tokenization
  //       const content = model.getValue();
  //       model.setValue(content + " ");
  //       model.setValue(content);
  //     }
  //   }, 100);
  // }

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
