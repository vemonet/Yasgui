/**
 * A tiny, read-only Monaco editor factory that REUSES the single monaco-vscode API instance that
 * lives inside yasqe (the one `startMonacoEditor` initializes). Consumers such as the YASR raw-response
 * plugin call this instead of importing monaco / monaco-languageclient themselves, so they don't bundle
 * a second Monaco (which would both bloat their bundle and collide with this instance at runtime).
 *
 * Everything heavy (monaco-languageclient, the JSON grammar extension) is dynamically imported inside
 * the function, so a static `export` of `createReadOnlyEditor` from yasqe's entry does NOT eagerly pull
 * Monaco into yasqe's main chunk — it stays lazy, loaded only when a viewer is actually created.
 */

/** Minimal structural surface the YASR response viewer needs — keeps consumers free of monaco types. */
export interface ReadOnlyEditor {
  setValue(value: string): void;
  getContentHeight(): number;
  onDidContentSizeChange(listener: () => void): unknown;
  layout(): void;
}

export interface ReadOnlyEditorHandle {
  editor: ReadOnlyEditor | undefined;
  dispose(): void;
}

// Distinct model URI per editor, otherwise re-creating reuses/leaks the previous model.
let modelCounter = 0;

// The lightweight, grammar-only JSON language extension (no JSON language server / validation worker).
// Registers the "json" language into THIS monaco-vscode instance, giving the viewer bracket-aware
// folding, bracket-pair colorization and a comment/bracket language configuration.
// NOTE: per-token color (strings/numbers/keys) is not applied — in this stack syntax colors come from
// language-server semantic tokens (as the SPARQL editor does), not from the TextMate grammar; JSON has
// no language server here, so it stays structurally highlighted but otherwise single-color.
let jsonExtensionLoaded: Promise<unknown> | undefined;
function loadJsonLanguage(): Promise<unknown> {
  if (!jsonExtensionLoaded) {
    // `whenReady()` resolves once the language is registered, so we await it before creating the model.
    jsonExtensionLoaded = import("@codingame/monaco-vscode-json-default-extension").then((m) => m.whenReady?.());
  }
  return jsonExtensionLoaded;
}

/**
 * Create a read-only editor in `container`, sharing yasqe's monaco-vscode instance.
 * @param language `"json"` registers + uses the JSON language; anything else is shown as plain text.
 * @param editorOptions Monaco editor options, deep-merged OVER the built-in read-only viewer defaults.
 */
export async function createReadOnlyEditor(
  container: HTMLElement,
  value: string,
  language: "json" | "plaintext" = "plaintext",
  editorOptions: Record<string, any> = {},
): Promise<ReadOnlyEditorHandle> {
  const { EditorApp } = await import("monaco-languageclient/editorApp");
  if (language === "json") await loadJsonLanguage();

  // We intentionally do NOT set a theme: Monaco themes are global, so the viewer inherits whatever
  // theme the main yasqe editor set (keeping dark/light mode in sync).
  const app = new EditorApp({
    readOnly: true,
    domReadOnly: true,
    codeResources: {
      modified: {
        text: value,
        uri: `yasqe-readonly-${modelCounter++}.${language === "json" ? "json" : "txt"}`,
        enforceLanguageId: language,
      },
    },
    editorOptions: {
      minimap: { enabled: false },
      lineNumbers: "on",
      folding: true,
      wordWrap: "on",
      scrollBeyondLastLine: false,
      overviewRulerLanes: 0,
      renderLineHighlight: "none",
      contextmenu: false,
      automaticLayout: true,
      fontSize: 13,
      padding: { top: 6, bottom: 6 },
      scrollbar: { alwaysConsumeMouseWheel: false },
      ...editorOptions,
    },
  });
  await app.start(container);

  return {
    editor: app.getEditor() as unknown as ReadOnlyEditor | undefined,
    dispose: () => void app.dispose(),
  };
}
