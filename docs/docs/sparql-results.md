# SPARQL Results

::: info Previously Yasr

The term yasr is kept for compatibility, especially in the CSS classes.

:::

`@rdfjs/sparql-results` renders a SPARQL response, as a table, raw response, graph or map. Use it standalone
when you have results from anywhere and want SparqlStudio's viewer without the editor.

Wire it to a [Yasqe](./sparql-editor) instance (or feed it a response from any source):

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
editor.on("queryResponse", (yasqe, response, duration) => {
  results.setResponse(response, duration);
});
```

## Feeding a response directly

You don't need Yasqe at all, `setResponse` accepts any SPARQL JSON / response object:

```ts
const results = new SparqlResults(document.getElementById("yasr")!);
results.setResponse(sparqlResultsJson);
```

## Result-view plugins

Yasr picks a sensible plugin based on the response (a table for `SELECT`, a boolean for `ASK`,
etc.). The live demo registers two extra plugins before creating the app:

```ts
import GraphPlugin from "@matdata/yasgui-graph-plugin";
import GeoPlugin from "yasgui-geo-tg";

SparqlStudio.Yasr.registerPlugin("Graph", GraphPlugin);
SparqlStudio.Yasr.registerPlugin("Geo", GeoPlugin);
```

Built-in and community plugins include:

- **Table** · sortable, paginated table for `SELECT` results.
- **Response** · the raw response body (JSON, XML, Turtle, …).
- **Boolean** · the result of an `ASK` query.
- **Graph** · node-link visualization of `CONSTRUCT` / `DESCRIBE` results.
- **Geo** · map view for results with geographic literals.

Users switch between the available plugins with the tabs above the result area.
