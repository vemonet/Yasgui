# SPARQL Results

::: info Previously Yasr

The term yasr is kept for compatibility, especially in the CSS classes.

:::

`@rdfjs/sparql-results` renders a SPARQL response, as a table, raw response, graph or map. Use it standalone
when you have results from anywhere and want SparqlStudio's viewer without the editor.

Wire it to a [SparqlEditor](./sparql-editor) instance (or feed it a response from any source):

```ts
import SparqlEditor from "@rdfjs/sparql-editor-monaco";
import SparqlResults from "@rdfjs/sparql-results";
import "@rdfjs/sparql-editor-monaco/style.css";
import "@rdfjs/sparql-results/style.css";

const editor = new SparqlEditor(document.getElementById("yasqe")!, {
  requestConfig: { endpoint: "https://sparql.dblp.org/sparql" },
});
const results = new SparqlResults(document.getElementById("yasr")!, {
  // resolve prefixed names in results using the query's PREFIX declarations
  prefixes: () => editor.getPrefixesFromQuery(),
});

// queryResponse is emitted instance-first: (yasqe, response, duration)
editor.on("queryResponse", (editor, response, duration) => {
  results.setResponse(response, duration);
});
```

## Feeding a response directly

You don't need SparqlEditor at all, `setResponse` accepts any SPARQL JSON / response object:

```ts
const results = new SparqlResults(document.getElementById("yasr")!);
results.setResponse(sparqlResultsJson);
```

## Result-view plugins

Yasr picks a sensible plugin based on the response (a table for `SELECT`, a boolean for `ASK`, etc.)
and users switch with the tabs above the result area. Built in are **Table**, **Response**,
**Boolean** and **Error**; **Graph** and **Geo** are community plugins you register before creating
the app:

```ts
import GraphPlugin from "@matdata/yasgui-graph-plugin";
import GeoPlugin from "yasgui-geo-tg";

SparqlStudio.Yasr.registerPlugin("Graph", GraphPlugin);
SparqlStudio.Yasr.registerPlugin("Geo", GeoPlugin);
```

See [Results plugins](./plugins) for each plugin's config, example queries and how to register your own.
