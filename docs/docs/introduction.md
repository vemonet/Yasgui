# What is SPARQL Studio?

**SPARQL Studio** is a web-based interface for writing, running and exploring SPARQL queries against any endpoint.

::: tip Compatible with Yasgui Yasr plugins
It is a fork of [Yasgui](https://github.com/zazuko/Yasgui) and is compatible with all existing Yasr result-view plugins.
:::

It is built from packages you can use together or independently:

| Package | npm | What it is |
| --- | --- | --- |
| **Studio** | `@rdfjs/sparql-studio` | The full **app**: tabs, endpoint selector, editor + Yasr wired together |
| **Editor · Monaco** | `@rdfjs/sparql-editor-monaco` | The SPARQL query **editor** (Monaco-based, with optional LSP) |
| **Editor · CodeMirror** | `@rdfjs/sparql-editor-codemirror` | Alternative SPARQL **editor** built on CodeMirror 6 (takes an LSP client) |
| **Results** | `@rdfjs/sparql-results` | The SPARQL **result** viewer (table, response, geo, …) |

Try it now on the [live demo](/). Then head to [Getting started](./getting-started) to embed it in your own app.

## 🔑 Key features

- **Advanced query editor** · SPARQL syntax highlighting, smart autocomplete, query formatting,
  prefix management, bracket matching and folding.
- **Powerful result viewers** · interactive tables, graph visualizations, geographic maps and a raw
  response viewer.
- **Multiple tabs** · work with several queries at once, each with its own endpoint.
- **Light and dark themes** · follows the OS preference, or set it explicitly.
- **Persistent storage** · queries, tabs and results survive a page reload via `localStorage`.
- **Developer friendly** · small ESM packages, an event system and a documented API.

## ⚡️ Powered by language servers

SPARQL Studio's smart features, semantic highlighting, diagnostics, code actions, hover, formatting and autocompletion, all come from a **SPARQL [language server (LSP)](https://microsoft.github.io/language-server-protocol/)**. SPARQL Studio editors are language server agnostic: you provide a ready language server and they wire a language client to it. All server-specific configuration lives in your app, which keeps the libraries small and lets you swap servers later.

The live demo uses 3 language servers:

- [**qlue-ls**](https://github.com/IoannisNezis/Qlue-ls), a WASM SPARQL language server, with endpoint-powered completion
- [**swls**](https://github.com/SemanticWebLanguageServer/swls), the semantic web language server
- [**Traqula**](https://github.com/comunica/traqula), SPARQL 1.2 JS parser

## 📝 Two editors to choose from

SPARQL Studio is editor-independent, you pick the editor implementation when embedding it:

| Editor | Package | When to use |
| --- | --- | --- |
| **Monaco** | `@rdfjs/sparql-editor-monaco` | The editor that powers VS Code, more features. |
| **CodeMirror 6** | `@rdfjs/sparql-editor-codemirror` | More lightweight. |

Both implement the same shared editor interface, so they are interchangeable behind SPARQL Studio's editor factory.
