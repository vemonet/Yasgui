# SPARQL Studio

::: info Formerly Yasgui

The term `yasgui` is kept for compatibility in the CSS classes and local storage key.

:::

`@rdfjs/sparql-studio` is the complete app: query tabs, an endpoint selector, and SparqlEditor + SparqlResults wired
together. [Getting started](./getting-started) walks through mounting it end to end (including the
language-server worker); this page is the configuration reference.

## The editor factory

SparqlStudio is **editor-independent**: instead of an editor config object, you pass a factory
`(parent, conf) => IEditor` that builds the editor. `conf` is the per-tab config SparqlStudio prepares
(value, requestConfig, …); spread it, then add your own options:

```ts
import SparqlStudio from "@rdfjs/sparql-studio";
import SparqlEditor from "@rdfjs/sparql-editor-monaco";
import "@rdfjs/sparql-studio/style.css";

const yasgui = new SparqlStudio(document.getElementById("yasgui")!, {
  requestConfig: { endpoint: "https://sparql.dblp.org/sparql" },
  editor: (parent, conf) => new SparqlEditor(parent, { ...conf /* + languageServers, theme, … */ }),
});
```

The factory is where you choose the editor implementation (Monaco `@rdfjs/sparql-editor-monaco` or
CodeMirror `@rdfjs/sparql-editor-codemirror`) and list its [language servers](./language-server),
theme and [editor options](./editor-options). `yasgui.editor.getLanguageClient()` returns the active
language client so you can send any LSP request. With two or more `languageServers`, a switcher lets
users pick one and SparqlStudio remembers the choice **per endpoint**.

## Configuration

| option | type | description |
| --- | --- | --- |
| `requestConfig` | `RequestConfig` | default endpoint & request settings (see [Request configuration](./request-config)) |
| `onEndpointChange` | `(client, endpoint) => void` | called when the active endpoint changes |
| `editor` | `SparqlEditorFactory` = `(parent, conf) => IEditor` | editor factory: build the editor (Monaco `@rdfjs/sparql-editor-monaco` or CodeMirror `@rdfjs/sparql-editor-codemirror`) and wire in its LSP, theme, etc. |
| `results` | `Partial<SparqlResults config>` | result-viewer config |
| `corsProxy` | `string` | optional CORS proxy URL |
| `persistenceId` | `string \| fn \| null` | localStorage namespace; `null` disables persistence |

## CORS

Public endpoints usually send the right CORS headers. For endpoints that don't, set a `corsProxy`:

```ts
new SparqlStudio(el, { corsProxy: "https://corsproxy.example/?" });
```

The proxy URL is prepended to the request URL.

## Persistence

By default SparqlStudio persists tabs, queries and the last results to `localStorage` under a namespace
derived from the container element id. Pass `persistenceId: null` to disable persistence, or a
string / function to control the namespace.
