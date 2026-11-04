# Change Log

## 5.0.0

### Major Changes

- deba252: - Migrate from CodeMirror 5 to Monaco/CodeMirror 6 editors with language servers
  - Users can now choose between 2 editors: one based on Monaco, the other based on CodeMirror 6
  - The editor now extends `EventEmitter` instead of `CodeMirror`, with a shared `IEditor` interface both editors implement
  - Enable use of language servers for diagnostics, syntax highlighting, autocompletion, code actions, hover and formatting
  - Delete the editor's built-in autocomplete and grammar code (now handled by the language server)
  - CodeMirror falls back to static SPARQL syntax highlighting when the language server provides no semantic tokens
  - Update some of the puppeteer tests
  - Language servers
    - Unified, editor-agnostic language server interface for both Monaco and CodeMirror: you pass a `Worker` (instance or factory) and the editor connects the client for you, waiting for the worker's `ready` signal
    - Support multiple language servers via a `languageServers` array, with runtime switching (right-click menu in Monaco, dropdown in CodeMirror) and a per-endpoint preference persisted to localStorage
    - Generic settings panel generated from a JSON schema, with a callback to apply settings to the active server
    - Improved display of error messages coming from the language server
    - Ship qlue-ls plumbing (settings, types, backend/endpoint registration, prefix discovery, completion-query templates) in utils under the `qlueLs` namespace, so consumers can wire it up easily
    - The app implements 3 language servers: **qlue-ls** (WASM, endpoint-powered completions), **swls** (WASM, semantic web language server) and **Traqula** (JS SPARQL 1.2 parser, diagnostics only)
  - App and editor improvements
    - Enable light/dark theme
    - Add a "Share query URL" entry to the Monaco right-click menu (under Execute query) bound to Cmd/Ctrl+S
    - Update the CodeMirror used by the results viewer to display the raw response JSON from v5 to v6
    - Update the default SPARQL endpoint from DBpedia to https://sparql.dblp.org/sparql (faster for completion queries)
    - Improve the partial config implementation (`DeepPartial`)
    - Enable importing the main JS and CSS from `@rdfjs/sparql-studio` and `@rdfjs/sparql-studio/style.css`
  - Docs
    - Add a documentation website built with VitePress (served from https://sparql.studio), with an API reference auto-generated using TypeDoc
    - The home page is the full app with monaco editor and the 3 language servers, a second page provides the app with the CodeMirror editor
  - Keep Monaco ESM-only because its workers/WASM use `import.meta.url`. Studio, CodeMirror, Results and Utils also ship self-contained `.umd.js` bundles for script tags, with `unpkg`, `jsdelivr` and `./umd` distribution entries. ESM remains the default for imports and supports external CodeMirror extensions.
  - Rename the packages and exported classes:
    - `@zazuko/yasgui` -> `@rdfjs/sparql-studio` (class `Yasgui` -> `SparqlStudio`)
    - `@zazuko/yasqe` -> `@rdfjs/sparql-editor-monaco` and a new `@rdfjs/sparql-editor-codemirror` (class `Yasqe` -> `SparqlEditor`)
    - `@zazuko/yasr` -> `@rdfjs/sparql-results` (class `Yasr` -> `SparqlResults`)
    - `@zazuko/yasgui-utils` -> `@rdfjs/sparql-utils`
    - The `SparqlStudio` config keys `yasqe`/`yasr` are now `editor`/`results`
    - Rename `window.yasgui` & cie to `window.sparqlStudio`
    - Rename CSS classes (`.yasgui* -> `.sparqlStudio*`)
  - add `postcss-nested` to flatten nested CSS

### Patch Changes

- efa9999: - Migrate from `webpack` to `vite` for the bundler and dev server
  - Update `.eslintrc.js` config file to modern module based `eslint.config.js`
  - Clean up unused dependencies
  - Remove unused files: `.gitignore` and `.npmignore` in packages folders, `yasgui.bootstrap.css` and `yasgui.polyfill.min.js` in `packages/yasgui/static/` folder
  - Move prettier 1 field config from `.prettierrc` file to the `package.json`
  - Remove dependency to prefix.cc API at runtime, bundle 500 most popular prefixes from prefix.cc directly in the lib

## 4.6.2

### Patch Changes

- 049233c: - Migrate from `webpack` to `vite` for the bundler and dev server
  - Update `.eslintrc.js` config file to modern module based `eslint.config.js`
  - Clean up unused dependencies
  - Remove unused files: `.gitignore` and `.npmignore` in packages folders, `yasgui.bootstrap.css` and `yasgui.polyfill.min.js` in `packages/yasgui/static/` folder
  - Move prettier 1 field config from `.prettierrc` file to the `package.json`
  - Remove dependency to prefix.cc API at runtime, bundle 500 most popular prefixes from prefix.cc directly in the lib

## 4.6.1

## 4.6.0

### Patch Changes

- 2e04999: Upgrade various dependencies

## 4.5.0

## 4.4.3

## 4.4.2

## 4.4.1

## 4.4.0

## 4.3.3

### Patch Changes

- d918c63: Fix `@rdfjs/sparql-utils` build (by @vemonet, in #17)
- d918c63: Upgrade some dependencies

## 4.3.2

## 4.3.1

## 4.3.0

### Patch Changes

- b14ed24: Update Git repository to https://github.com/rdfjs/Yasgui

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.0.107](https://github.com/TriplyDB/yasgui/compare/v4.0.106...v4.0.107) (2020-03-01)

**Note:** Version bump only for package @triply/yasgui-utils

## [4.0.106](https://github.com/TriplyDB/yasgui/compare/v4.0.105...v4.0.106) (2020-02-25)

**Note:** Version bump only for package @triply/yasgui-utils
