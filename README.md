# 🫆 SPARQL Qlue editor

[![Deploy to GitHub Pages](https://github.com/vemonet/Yasgui/actions/workflows/deploy.yml/badge.svg)](https://github.com/vemonet/Yasgui/actions/workflows/deploy.yml)

Yasgui consists of three components:

- **Yasqe**, a SPARQL query editor
- **Yasr**, a SPARQL result visualizer
- **Yasgui**, which binds the former together.

## 🍴 About this fork

This is a fork of [@zazuko/Yasgui](https://github.com/zazuko/Yasgui) which introduces these changes:

- [x] Use the [**Qlue-ls SPARQL language server**](https://github.com/IoannisNezis/Qlue-ls) and [**Monaco editor**](https://microsoft.github.io/monaco-editor/) (what powers VSCode), to replace the [CodeMirror5](https://codemirror.net/5/) editor.
- [x] Autocomplete is now [built-in based on SPARQL queries](https://arxiv.org/abs/2104.14595) sent to the endpoint, queries can be customized and optimized
- [x] Built-in support for light/dark themes
- [x] Migrate build tool to [**vite**](https://vite.dev/) from webpack, the packages are now available as ES modules and Common JS.
- [x] Migrate SCSS to CSS, using regular CSS variables to make style more easily configurable.

> [!CAUTION]
>
> This is a work in progress.

## 📥 Installation

### Via package managers

To include Yasgui in a project include the package run the command below.

```sh
npm i --save @sib-swiss/yasgui
```

If you want to work with the Yasqe and Yasr components separately:

```sh
npm i --save @sib-swiss/yasqe @sib-swiss/yasr
```

### Via CDN

To include Yasgui in your webpage, all that's needed is importing the Yasgui JavaScript and CSS files, and initializing a Yasgui object:

```html
<body>
  <div id="yasgui"></div>
  <script type="module">
    import Yasgui from "@sib-swiss/yasgui";
    import "@sib-swiss/yasgui/dist/yasgui.css";

    const yasgui = new Yasgui(document.getElementById("yasgui"));
  </script>
</body>
```

## ⚡️ Usage

### 🚀 Deploy Yasgui

You can deploy `Yasgui` directly, this provide an input to change the SPARQL endpoint and tabs to have multiple editors open at the same time.

Here is a minimal example to deploy Yasgui directly in a `.html` file:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Yasgui</title>
    <style>
      body {
        font-family: sans-serif;
        margin: 0px;
      }
    </style>
  </head>
  <body>
    <div id="yasgui"></div>

    <script type="module">
      import Yasgui from "@sib-swiss/Yasgui";
      import "@sib-swiss/yasgui/dist/yasgui.css";

      const yasgui = new Yasgui(document.getElementById("yasgui"), {
        requestConfig: {
          endpoint: "https://sparql.uniprot.org/sparql/",
        },
        yasqe: {
          theme: "dark",
        },
      });
    </script>
  </body>
</html>
```

> [!TIP]
>
> If you only want to use Yasgui for querying a specific endpoint, you can add the following styling to disable the endpoint selector:
>
> ```html
> <style>
>   .yasgui .autocompleteWrapper {
>     display: none !important;
>   }
> </style>
> ```

### 🎨 Deploy Yasqe and Yasr

Otherwise you can manually deploy `Yasqe` (editor) and `Yasr` (query results) separately, alone or together. Here is a minimal example to deploy and connect them:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Yasqe + Yasr</title>
    <style>
      body {
        font-family: sans-serif;
        margin: 0px;
      }
    </style>
  </head>
  <body>
    <div id="yasqe"></div>
    <div id="yasr"></div>

    <script type="module">
      import Yasqe from "@sib-swiss/Yasqe";
      import Yasr from "@sib-swiss/Yasr";
      import "@sib-swiss/yasqe/dist/yasqe.css";
      import "@sib-swiss/yasr/dist/yasr.css";

      // Initialize Yasqe and Yasr
      const yasqe = new Yasqe(document.getElementById("yasqe"), {
        requestConfig: { endpoint: "https://sparql.uniprot.org/sparql/" },
        theme: "dark",
        showQueryButton: false,
        createShareableLink: null,
      });
      const yasr = new Yasr(document.getElementById("yasr"), {});

      // Connect Yasqe to Yasr, pass Yasqe query response to Yasr
      yasqe.on("queryResponse", (response, duration) => {
        yasr.setResponse(response, duration);
      });
    </script>
  </body>
</html>
```

### 🌗 Light/dark theme

Yasgui comes with a built-in support for light/dark theme.

You can use the following method to change the theme easily:

```ts
yasgui.getTab().getYasqe().setTheme("light");
```

<details><summary>Dark theme configuration is done through `data-theme` variables</summary>

```css
html[data-theme="dark"] {
  /* Yasgui */
  --yasgui-text: #eeeeee;
  --yasgui-border: rgba(255, 255, 255, 0.26);
  --yasgui-focus: #4fc3f7;
  --yasgui-link: #4fc3f7;
  --yasgui-link-hover: #29b6f6;
  --yasgui-label: rgba(255, 255, 255, 0.54);
  --yasgui-nav-bg: #2d2d30;
  --yasgui-nav-text: #cccccc;
  --yasgui-nav-text-hover: #ffffff;
  --yasgui-nav-text-active: #e0e0e0;
  --yasgui-tab-text: #c0c0c0;
  --yasgui-btn-text: #c0c0c0;
  --yasgui-panel-bg: #3e3e3e;
  --yasgui-panel-border: #2d2d30;
  /* Yasqe */
  --yasqe-text: #d4d4d4;
  --yasqe-border: #3e3e3e;
  --yasqe-notification-bg: #2d2d30;
  --yasqe-notification-text: #cccccc;
  --yasqe-tooltip-bg: rgba(255, 255, 255, 0.1);
  --yasqe-tooltip-text: #ffffff;
  --yasqe-error: #ff6b6b;
  /* Yasr */
  --yasr-text: #d4d4d4;
  --yasr-border: #3e3e3e;
  --yasr-link: #4fc3f7;
  --yasr-link-hover: #29b6f6;
  --yasr-btn-text: #c0c0c0;
  --yasr-btn-selected: #4fc3f7;
  --yasr-fallback-bg: #2d2d30;
  --yasr-fallback-border: #3e3e3e;
  --yasr-help-bg: #1a3a4a;
  --yasr-help-text: #4fc3f7;
  --yasr-chip-bg: #2d2d30;
  --yasr-chip-text: #cccccc;
}
```

</details>

## 📚 API Reference

### 🧩 Yasgui API

Yasgui features tabs. Each tab has its own isolated query and results.

These are persistent as the user switches between tabs.

```js
// Add a new Tab. Returns the new Tab object.
yasgui.addTab(
  true, // set as active tab
  { ...Yasgui.Tab.getDefaults(), name: "my new tab" }
);
// Get a Tab. Returns the current Tab if no tab id is given.
yasgui.getTab("tab_id_x");
```

#### Tab API

```js
// set the query of the tab
tab.setQuery("select * where {...}");
// close the tab
tab.close();
// access the Yasqe API for the tab
tab.getYasqe();
// access the Yasr API for the tab
tab.getYasr;
```

#### Yasgui Events

Yasgui emits several Events. For information on how to use Events, see [NodeJS's Event documentation](https://nodejs.org/api/events.html).

```ts
// Fires when a query is executed
yasgui.on("query", (instance: Yasgui, tab: Tab) => {});
// Fires when a query is finished
yasgui.on("queryResponse", (instance: Yasgui, tab: tab) => {});
```

#### Yasgui Configuration

This configuration object is accessible/changeable via `Yasgui.defaults` or `yasgui.config`. You can pass these along when initializing Yasgui as well. To change settings to the Yasqe and Yasr components used by Yasgui, you are best off changing the `Yasgui.Yasqe.defaults` and `Yasgui.Yasr.defaults` objects before initializing Yasgui.

```js
{
  /**
   * Change the default request configuration, such as the headers
   * and default yasgui endpoint.
   * Define these fields as plain values, or as a getter function
   */
  requestConfig: {
    endpoint: 'https://example.org/sparql',
    //Example of using a getter function to define the headers field:
    headers: () => ({
      'key': 'value'
    }),
    method: 'POST',
  },
  // Allow resizing of the Yasqe editor
  resizeable: true,
  // Whether to autofocus on Yasqe on page load
  autofocus: true,
  // Use the default endpoint when a new tab is opened
  copyEndpointOnNewTab: false,
  // Configuring which endpoints appear in the endpoint catalogue list
  endpointCatalogueOptions {
    getData: () => {
      return [
        //List of objects should contain the endpoint field
        //Feel free to include any other fields (e.g. a description or icon
        //that you'd like to use when rendering)
        {
          endpoint: "https://dbpedia.org/sparql"
        },
        {
          endpoint: "https://query.wikidata.org"
        }
        // ...
      ];
    },
    //Data object keys that are used for filtering. The 'endpoint' key already used by default
    keys: [],
    //Data argument contains a `value` property for the matched data object
    //Source argument is the suggestion DOM element to append your rendered item to
    renderItem: (data, source) => {
        const contentDiv = document.createElement("div");
        contentDiv.innerText = data.value.endpoint;
        source.appendChild(contentDiv);
      }
  }
}
```

### 🎨 Yasqe

Yasqe uses the Qlue-ls SPARQL language server and Monaco editor.

#### Yasqe API

The Yasqe API can be accessed via `yasqe` (if Yasqe is run standalone) or via a tab `yasgui.getTab().yasqe` when run in Yasgui

```js
// Set query value in editor
yasqe.setValue("select * where {...}");
// Get query value from editor
yasqe.getValue();
// execute a query
yasqe.query({
  url: "https://dbpedia.org/sparql",
  reqMethod: "POST", // or "GET"
  headers: { Accept: "..." /*...*/ },
  args: { arg1: "val1" /*...*/ },
  withCredentials: false,
});
// get whether we're in query or update mode
yasqe.getQueryMode();
// get the query type (select, ask, construct, ...)
yasqe.getQueryType();
// get prefixes map from the query string
yasqe.getPrefixesFromQuery();
// Add prefixes to the query.
yasqe.addPrefixes({ dbo: "http://dbpedia.org/ontology/" });
// Remove prefixes to the query.
yasqe.removePrefixes({ dbo: "http://dbpedia.org/ontology/" });
// set size of input area
yasqe.setSize(500, 300);
// Collapsing prefixes if there are any. Use false to expand them.
yasqe.collapsePrefixes(true);
// Change the theme (light/dark)
yasqe.setTheme("dark");
```

#### Yasqe Events

Yasqe emits several Events. For information on how to use Events, see [NodeJS's Event documentation](https://nodejs.org/api/events.html).

```ts
// Fires when a query is executed
yasqe.on("query", (instance: Yasqe, req: superagent.SuperAgentRequest) => {});
// Fires when a query is finished
yasqe.on("queryResponse", (instance: Yasqe, req: superagent.SuperAgentRequest, duration: number) => {});
```

#### Yasqe Configuration

The configuration options, for Yasqe can be accessed through `Yasgui.Yasqe` or `yasqe.options`.

Here are some configurable fields for Yasqe. They can be accessed and set through `Yasqe.defaults` and `yasqe.options`. The configuration object extends the [CodeMirror config](https://codemirror.net/doc/manual.html#config), meaning fields like for example `tabSize` may also be set.

```ts
// number of seconds to persist query input, stored in the browser
// set to 0 to always load the default query on page load
persistencyExpire // default: 30 days

// default settings for how to query the endpoint
requestOpts: {
  endpoint: "http://dbpedia.org/sparql",
  method: "POST",
  headers: {}
},
```

### 📊 Yasr

Yasr is an extendable library that renders SPARQL results. Yasr is responsible for gluing the different visualization plugins together, and providing utilities such as SPARQL result parsers.

#### Yasr API

```ts
// Set and draw a SPARQL response. The parameter is either
// - a plain response string
// - a SuperAgent response
// - or an object with the specified keys
yasr.setResponse({
  data: "...";
  contentType: "application/sparql-results+json";
  status: 200;
  executionTime: 1000; // ms
  // error to show
})
// Draw results with current plugin
yasr.draw()
// Check whether a result has been drawn
yasr.somethingDrawn()
// Select a plugin
yasr.selectPlugin("table")
// Download a result set (if possible)
yasr.download()
```

#### Yasr Events

```ts
// Fires just before a plugins draws the results
yasr.on("draw",(instance: Yasr, plugin: Plugin) => void);
// Fires when a plugin finished drawing the results
yasr.on("drawn",(instance: Yasr, plugin: Plugin) => void);
```

#### Yasr Configuration

This configuration object is accessible/changeable via `Yasr.defaults` and `yasr.options`, and you can pass these along when initializing Yasr as well. Output visualizations are defined separately.

```ts
// Ordered list of enabled output plugins
pluginOrder = ["table", "response"]
// The default plugin
defaultPlugin = "table"
// seconds before results expire in the browser
// Set to 0 to disable results persistency
persistencyExpire // default: 30 days
// Map of prefixes to use in results views
prefixes: {"dbo":"http://dbpedia.org/ontology/",/*...*/}
```

#### Yasr plugins

Each plugin has its own configuration options.
These options can be accessed through `Yasr.plugins`.

##### Table

This plugin shows SPARQL results as a table, using the [DataTables.net](https://datatables.net/) plugin. This plugin is defined in `Yasr.plugins.table` and can be configured using `Yasr.plugins.table.defaults`.

```ts
// Open URIs in results in a new window rather than the current.
openIriInNewWindow = true;
```

##### Raw Response

A plugin which uses [CodeMirror](https://codemirror.net/) to present the SPARQL results as-is. This plugin is defined at `Yasr.plugins.response` and can be configured using `Yasr.plugins.response.defaults`.

```ts
// Number of lines to show before hiding rest of response
// (too large value may cause browser performance issues)
maxLines = 30;
```

#### Writing a Yasr plugin

To register a Yasr plugin, add it to Yasr by running `Yasr.registerPlugin(pluginName: string, plugin: Plugin)`. Below is an example implementation for rendering the result of an Ask query, which returns either `true` or `false`. See also the implementations of the [Table](https://github.com/TriplyDB/YASGUI.YASR/blob/gh-pages/src/table.js) and [Raw Response](https://github.com/TriplyDB/YASGUI.YASR/blob/gh-pages/src/rawResponse.js) plugins.

```ts
class Boolean {
  // A priority value. If multiple plugin support rendering of a result, this value is used
  // to select the correct plugin
  priority = 10;
  // Whether to show a select-button for this plugin
  hideFromSelection = true;

  constructor(yasr) {
    this.yasr = yasr;
  }

  // Draw the result set. This plugin simply draws the string 'True' or 'False'
  draw() {
    const el = document.createElement("div");
    el.textContent = this.yasr.results.getBoolean() ? "True" : "False";
    this.yasr.resultsEl.appendChild(el);
  }

  // A required function, used to indicate whether this plugin can draw the current
  // resultset from yasr
  canHandleResults() {
    return (
      this.yasr.results.getBoolean &&
      (this.yasr.results.getBoolean() === true || this.yasr.results.getBoolean() == false)
    );
  }
  // A required function, used to identify the plugin, works best with an svg
  getIcon() {
    const textIcon = document.createElement("p");
    textIcon.innerText = "✓/✗";
    return textIcon;
  }
}
//Register the plugin to Yasr
Yasr.registerPlugin("MyBooleanPlugin", Boolean);
```

## ❓ FAQ

### Using Yasgui in react

To include Yasgui in React, use the following snippet. This snippet assumes a React repository configured via [create-react-app](https://github.com/facebook/create-react-app), and a minimum React version of 16.8.

```ts
import Yasgui from "@triply/yasgui";
import "@triply/yasgui/build/yasgui.min.css";

export default function App() {
  useEffect(() => {
    const yasgui = new Yasgui(document.getElementById("yasgui"));
    return () => {};
  }, []);
  return <div id="yasgui" />;
}
```

## 🛠️ Local development

### Installing dependencies

```sh
npm i
```

### Running Yasgui locally

```sh
npm run dev
```

### Compiling Yasgui

```sh
npm run build
```

### Deploy demo

```sh
npm run demo:dev
```

Or preview the production build (need to build first):

```sh
npm run demo:preview
```

> [!CAUTION]
>
> There is an outstanding [issue](https://github.com/TypeFox/monaco-languageclient/issues/950) with the `monaco-editor-wrapper`. To fix it go to `node_modules/monaco-editor-wrapper/dist/vscode/services.js` and comment the following lines:
>
> ```js
> export const augmentViewsServices = async (services, viewsConfig) => {
> 		// [...]
>     else if (viewsConfig?.viewServiceType === 'WorkspaceService') {
>         // const getWorkbenchServiceOverride = (await import('@codingame/monaco-vscode-workbench-service-override')).default;
>         // mergeServices(services, {
>         //     ...getWorkbenchServiceOverride()
>         // });
>     }
>     // [...]
> };
> ```

### To do

- [ ] Collapse all prefixes as 1 block
- [ ] `getPrefixesFromQuery`
- [ ] Check previous `extraKeys` (see `yasqe/defaults.ts`) are supported in new editor

## 📜 License

This is a fork from [Zazuko](https://zazuko.com/) fork of a software written by [Triply](https://triplydb.com/).

This code is released under the MIT license.
