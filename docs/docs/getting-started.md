# Getting started

This guide embeds the full SparqlStudio app with the recommended **qlue-ls** language server. If you only
need the editor or the result viewer, see [Yasqe](./yasqe) and [Yasr](./yasr).

## 1. Install

```bash
npm install @rdfjs/sparql-studio          # or @rdfjs/sparql-editor-monaco / @rdfjs/sparql-results individually
```

To use the qlue-ls language server (recommended), also add it and the Vite WASM plugin to **your
app**:

```bash
npm install qlue-ls
npm install -D vite-plugin-wasm
```

The `@rdfjs/*` packages are **self-contained ESM bundles** (Monaco and the language client are
bundled in), you do **not** need to install `monaco-editor`. They are **ESM only** (Monaco loads
its workers via `import.meta.url`, which UMD can't do), so use a modern bundler (Vite recommended).

Each package ships its own CSS that you must import once:

```js
import "@rdfjs/sparql-studio/style.css";
// or for standalone use:
// import "@rdfjs/sparql-editor-monaco/style.css";
// import "@rdfjs/sparql-results/style.css";
```

## 2. Bundler setup (Vite)

Because the qlue-ls worker loads WebAssembly, your app's Vite config needs `vite-plugin-wasm` and ES-module workers:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [wasm()],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
});
```

::: info
If you don't use a language server at all, none of this is needed, the editor still does syntax highlighting.
:::

## 3. Set up the qlue-ls language server

The language server runs in a **Web Worker**. The qlue-ls backend/settings plumbing ships with the package (the `qlueLs` helpers), so the only file you write is the worker, plus a tiny factory. These are also the only files you change to switch to a different SPARQL language server later. See the [Language server](./language-server) page for details; here is the minimal setup:

:::code-group

```ts [qlue-ls.ts]
// qlue-ls.ts
import QlueLsWorker from "./qlue-ls.worker?worker";

/** Create a qlue-ls worker and resolve once its WASM is ready. */
export function createQlueLsWorker(): Promise<Worker> {
  return new Promise((resolve) => {
    const worker = new QlueLsWorker({ name: "qlue-ls" });
    worker.onmessage = (e) => {
      if (e.data?.type === "ready") resolve(worker);
    };
  });
}
```

```ts [qlue-ls.worker.ts]
// @ts-ignore qlue-ls is loaded as a WASM module via vite-plugin-wasm
import init, { init_language_server, listen } from "qlue-ls?init";

init().then(() => {
  const input = new TransformStream();
  const output = new TransformStream();
  const reader = output.readable.getReader();
  const writer = input.writable.getWriter();

  const server = init_language_server(output.writable.getWriter());
  listen(server, input.readable.getReader());

  self.onmessage = (msg) => writer.write(JSON.stringify(msg.data));
  (async () => {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      self.postMessage(JSON.parse(value));
    }
  })();

  self.postMessage({ type: "ready" }); // tell the host the WASM is initialized
});
export {};
```

:::

## 4. Mount SparqlStudio

```ts
import SparqlStudio from "@rdfjs/sparql-studio";
import Yasqe, { qlueLs } from "@rdfjs/sparql-editor-monaco";
import "@rdfjs/sparql-studio/style.css";
import { createQlueLsWorker } from "./qlue-ls";

const yasgui = new SparqlStudio(document.getElementById("yasgui")!, {
  requestConfig: { endpoint: "https://sparql.dblp.org/sparql" },

  // Editor factory: SparqlStudio is editor-independent, so you build the editor yourself.
  // Each server per-entry hooks fire only while it is active: onReady, onEndpointChange
  yasqe: (parent, conf) =>
    new Yasqe(parent, {
      ...conf,
      languageServers: [
        {
          label: "Qlue-ls",
          worker: createQlueLsWorker,
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

::: tip CodeMirror instead of Monaco
The factory is also where you choose the editor implementation. To use the CodeMirror 6 editor, import `@rdfjs/sparql-editor-codemirror` instead and give each language server a `client` (an `LSPClient`) rather than a `worker` (see [Language server](./language-server)).
:::

::: tip Offering several servers
Add more entries to `languageServers` to let users switch at runtime; with two or more, a switcher appears (right-click in Monaco, a dropdown in CodeMirror) and the choice is remembered per endpoint.
:::

That is the same setup that powers the [live demo](/). From here:

- [SparqlStudio (full app)](./yasgui) · the complete config reference.
- [Language server](./language-server) · richer completion queries and using a different LSP.
- [Theming](./theming) · light/dark wiring.
