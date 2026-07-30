# Change Log

## 5.0.0

### Major Changes

- ff3922d: - Migrate from CodeMirror 5 to Monaco/CodeMirror 6 editors with language servers
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
    - The demo implements 3 language servers: **qlue-ls** (WASM, endpoint-powered completions), **swls** (WASM, semantic web language server) and **Traqula** (JS SPARQL 1.2 parser, diagnostics only)
  - App and editor improvements
    - Enable light/dark theme
    - Add a "Share query URL" entry to the Monaco right-click menu (under Execute query) bound to Cmd/Ctrl+S
    - Update the CodeMirror used by the results viewer to display the raw response JSON from v5 to v6
    - Update the default SPARQL endpoint from DBpedia to https://sparql.dblp.org/sparql (faster for completion queries)
    - Improve the partial config implementation (`DeepPartial`)
    - Enable importing the main JS and CSS from `@rdfjs/sparql-studio` and `@rdfjs/sparql-studio/style.css`
  - Docs
    - Add a documentation website built with VitePress (served from https://sparql.studio), with an auto-generated API reference (TypeDoc)
    - The home page is the full app with the 3 language servers, a second page demos the CodeMirror editor
  - Drop UMD support: the libraries are now ESM-only (Monaco loads its workers/wasm via `import.meta.url`, which UMD cannot express). ESM imports work in plain HTML `<script type="module">` in every browsers.
  - Rename the packages and exported classes:
    - `@zazuko/yasgui` -> `@rdfjs/sparql-studio` (class `Yasgui` -> `SparqlStudio`)
    - `@zazuko/yasqe` -> `@rdfjs/sparql-editor-monaco` and a new `@rdfjs/sparql-editor-codemirror` (class `Yasqe` -> `SparqlEditor`)
    - `@zazuko/yasr` -> `@rdfjs/sparql-results` (class `Yasr` -> `SparqlResults`)
    - `@zazuko/yasgui-utils` -> `@rdfjs/sparql-utils`
    - The `SparqlStudio` config keys `yasqe`/`yasr` are now `editor`/`results`
    - Rename `window.yasgui` & cie to `window.sparqlStudio`
    - Rename CSS classes (`.yasgui* -> `.sparqlStudio\*`)
  - add `postcss-nested` to flatten nested CSS

### Patch Changes

- 049233c: - Migrate from `webpack` to `vite` for the bundler and dev server
  - Update `.eslintrc.js` config file to modern module based `eslint.config.js`
  - Clean up unused dependencies
  - Remove unused files: `.gitignore` and `.npmignore` in packages folders, `yasgui.bootstrap.css` and `yasgui.polyfill.min.js` in `packages/yasgui/static/` folder
  - Move prettier 1 field config from `.prettierrc` file to the `package.json`
  - Remove dependency to prefix.cc API at runtime, bundle 500 most popular prefixes from prefix.cc directly in the lib
- Updated dependencies [ff3922d]
- Updated dependencies [049233c]
  - @rdfjs/sparql-utils@5.0.0

## 4.6.1

### Patch Changes

- 2285bff: Fix the display of results of DESCRIBE and CONSTRUCT queries.
  - @rdfjs/sparql-utils@4.6.1

## 4.6.0

### Patch Changes

- 2e04999: Upgrade various dependencies
- Updated dependencies [2e04999]
  - @rdfjs/sparql-utils@4.6.0

## 4.5.0

### Patch Changes

- @rdfjs/sparql-utils@4.5.0

## 4.4.3

### Patch Changes

- b835764: Fix support for CONSTRUCT queries.
  - @rdfjs/sparql-utils@4.4.3

## 4.4.2

### Patch Changes

- c7ae45e: Fix `Content-Type` header for `fetch` GET request
  - @rdfjs/sparql-utils@4.4.2

## 4.4.1

### Patch Changes

- @rdfjs/sparql-utils@4.4.1

## 4.4.0

### Minor Changes

- 2489238: Replace `superagent` with standard `fetch` (from @vemonet in #19)

### Patch Changes

- @rdfjs/sparql-utils@4.4.0

## 4.3.3

### Patch Changes

- d918c63: Upgrade some dependencies
- d918c63: Add a `queryBefore` event on Yasgui and Yasqe (by @vemonet, in #16)
- Updated dependencies [d918c63]
- Updated dependencies [d918c63]
  - @rdfjs/sparql-utils@4.3.3

## 4.3.2

### Patch Changes

- @rdfjs/sparql-utils@4.3.2

## 4.3.1

### Patch Changes

- @rdfjs/sparql-utils@4.3.1

## 4.3.0

### Patch Changes

- b14ed24: Update Git repository to https://github.com/rdfjs/Yasgui
- Updated dependencies [b14ed24]
  - @rdfjs/sparql-utils@4.3.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.0.111](https://github.com/TriplyDB/yasgui/compare/v4.0.109...v4.0.111) (2020-03-20)

**Note:** Version bump only for package @triply/yasqe

## [4.0.110](https://github.com/TriplyDB/yasgui/compare/v4.0.109...v4.0.110) (2020-03-20)

**Note:** Version bump only for package @triply/yasqe

## [4.0.108](https://github.com/TriplyDB/yasgui/compare/v4.0.107...v4.0.108) (2020-03-10)

**Note:** Version bump only for package @triply/yasqe

## [4.0.107](https://github.com/TriplyDB/yasgui/compare/v4.0.106...v4.0.107) (2020-03-01)

**Note:** Version bump only for package @triply/yasqe

## [4.0.106](https://github.com/TriplyDB/yasgui/compare/v4.0.105...v4.0.106) (2020-02-25)

**Note:** Version bump only for package @triply/yasqe

## [4.0.105](https://github.com/TriplyDB/yasgui/compare/v4.0.104...v4.0.105) (2020-02-10)

**Note:** Version bump only for package @triply/yasqe

## [4.0.104](https://github.com/TriplyDB/yasgui/compare/v4.0.103...v4.0.104) (2020-02-10)

**Note:** Version bump only for package @triply/yasqe

## [4.0.103](https://github.com/TriplyDB/yasgui/compare/v4.0.102...v4.0.103) (2020-02-10)

**Note:** Version bump only for package @triply/yasqe

## [4.0.102](https://github.com/TriplyDB/yasgui/compare/v4.0.101...v4.0.102) (2020-02-07)

**Note:** Version bump only for package @triply/yasqe
