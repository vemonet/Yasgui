# SPARQL Editor

::: info Previously Yasqe

The term yasqe is kept for compatibility, especially in the CSS classes.

:::

`@rdfjs/sparql-editor-monaco` is the SPARQL query editor on its own, the Monaco editor plus an optional language
client. Use it when you want only the editor, without tabs or the result viewer.

```ts
import SparqlEditor, { qlueLs } from "@rdfjs/sparql-editor-monaco";
import "@rdfjs/sparql-editor-monaco/style.css";
import QlueLsWorker from "./qlue-ls.worker?worker";

const endpoint = "https://sparql.dblp.org/sparql";
const editor = new SparqlEditor(document.getElementById("yasqe")!, {
  value: "SELECT * WHERE { ?s ?p ?o } LIMIT 10",
  requestConfig: { endpoint },
  languageServers: [
    {
      label: "Qlue-ls",
      worker: () => new QlueLsWorker({ name: "qlue-ls" }),
      onReady: (client) => {
        qlueLs.configureSettings(client);
        qlueLs.configureBackend(client, endpoint);
      },
      // Per-server, fires only while this server is active; trigger it with notifyEndpointChange().
      onEndpointChange: (client, endpoint) => qlueLs.configureBackend(client, endpoint),
    },
  ],
});

editor.on("query", (editor, req) => console.log("running", req));
editor.on("queryResponse", (yasqe, response, duration) => console.log(response, duration));
```

With an empty `languageServers`, Yasqe still works as a syntax-highlighted editor, you just don't get
completion, diagnostics or formatting. The `languageServers` array, its per-server `onReady` /
`onEndpointChange` hooks, the runtime switcher and helpers like `getLanguageClient()` /
`setLanguageServer()` / `notifyEndpointChange()` are all covered in
[Language server](./language-server) — this is the same config the full app uses.

::: warning Events are instance-first
Yasqe events are emitted **instance-first**, handlers receive `(yasqeInstance, ...payload)`. For
example `queryResponse` is `(yasqe, response, duration)`.
:::

## Common config

| option | description |
| --- | --- |
| `value` | initial query string |
| `theme` | `"light"` / `"dark"` (defaults to the OS preference) |
| `editorOptions` | [Monaco options](./editor-options), deep-merged over the defaults |
| `requestConfig` | how queries are sent, see [Request configuration](./request-config) |
| `editorHeight` | initial editor height (e.g. `"300px"`) |
| `resizeable` | whether the editor can be resized |
| `showQueryButton` | show the run button |
| `persistenceId` | localStorage namespace |
| `languageServers` | array of language servers (`{ label, description?, worker, onReady?, onEndpointChange? }`); empty for highlighting-only. The first is activated on load; 2+ adds a switcher. The `onReady`/`onEndpointChange` hooks fire only for the active server |
