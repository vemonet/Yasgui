# SPARQL Studio

::: info Previously Yasgui

The term yasgui is kept for compatibility, especially in the CSS classes.

:::

`@rdfjs/sparql-studio` is the complete app: query tabs, an endpoint selector, and Yasqe + Yasr wired
together.

```ts
import SparqlStudio from "@rdfjs/sparql-studio";
import SparqlEditor, { qlueLs } from "@rdfjs/sparql-editor-monaco";
import "@rdfjs/sparql-studio/style.css";
import QlueLsWorker from "./qlue-ls.worker?worker";

const yasgui = new SparqlStudio(document.getElementById("yasgui")!, {
  requestConfig: { endpoint: "https://sparql.dblp.org/sparql" },
  // Editor factory: build the editor and wire in its language server. `conf` is the
  // per-tab config SparqlStudio prepares (value, requestConfig, …); spread it, then add your own.
  editor: (parent, conf) =>
    new SparqlEditor(parent, {
      ...conf,
      languageServers: [
        {
          label: "Qlue-ls",
          worker: () => new QlueLsWorker({ name: "qlue-ls" }),
          onReady: (client) => {
            qlueLs.configureSettings(client);
            qlueLs.configureBackend(client, yasgui?.getTab()?.getEndpoint());
          },
          onEndpointChange: (client, endpoint) => qlueLs.configureBackend(client, endpoint),
        },
      ],
    }),
});
```

SparqlStudio is **editor-independent**: instead of an editor config object, you pass a factory
`(parent, conf) => IYasqe` that builds the editor. This is where you choose the editor implementation
(Monaco `@rdfjs/sparql-editor-monaco` above, or CodeMirror `@rdfjs/sparql-editor-codemirror`) and list its language
servers and theme. `qlueLs` is only exported from `@rdfjs/sparql-editor-monaco` (the Monaco editor), not from
`@rdfjs/sparql-studio`.

`yasgui.editor.getLanguageClient()` returns the active language client so you can send any LSP request.
When two or more `languageServers` are configured, a switcher lets users pick one and SparqlStudio
remembers the choice **per endpoint**, so each endpoint reopens with its preferred server.

## Configuration

| option | type | description |
| --- | --- | --- |
| `requestConfig` | `RequestConfig` | default endpoint & request settings (see [Request configuration](./request-config)) |
| `onEndpointChange` | `(yasgui, endpoint) => void` | called when the active endpoint changes |
| `yasqe` | `YasqeFactory` = `(parent, conf) => IYasqe` | editor factory: build the editor (Monaco `@rdfjs/sparql-editor-monaco` or CodeMirror `@rdfjs/sparql-editor-codemirror`) and wire in its LSP, theme, etc. |
| `yasr` | `Partial<Yasr config>` | result-viewer config |
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
