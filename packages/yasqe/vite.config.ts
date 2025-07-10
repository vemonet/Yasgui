import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import typescript from "@rollup/plugin-typescript";
// import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  base: "./",
  assetsInclude: ["**/*.wasm"],
  build: {
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@sib-swiss/yasqe",
      fileName: "yasqe",
    },
    sourcemap: true,
    // cssCodeSplit: true, // Causes out of memory error
    rollupOptions: {
      plugins: [typescript()],
      // external: ["@codingame/monaco-editor-wrapper"],
      output: {
        // Enable cleaner file structure
        inlineDynamicImports: true,
        // Ensure proper format for dynamic imports
        format: "es",
      },
    },
  },
  optimizeDeps: {
    include: [
      "vscode-textmate",
      "vscode-oniguruma",
      "@codingame/monaco-vscode-api",
      "@codingame/monaco-editor-wrapper",
      // "monaco-editor/esm/vs/editor/editor.worker",
      // "monaco-editor/esm/vs/language/json/json.worker",
      // "monaco-editor/esm/vs/language/css/css.worker",
      // "monaco-editor/esm/vs/language/html/html.worker",
      // "monaco-editor/esm/vs/language/typescript/ts.worker",
      "qlue-ls",
      // "monaco-editor",
      // "monaco-editor-wrapper",
    ],
    exclude: [
      // "qlue-ls"
    ],
    // esbuildOptions: {
    //   plugins: [importMetaUrlPlugin],
    // },
  },
  plugins: [wasm(), topLevelAwait()],
  worker: {
    format: "es",
    plugins: () => [wasm(), topLevelAwait()],
  },
});
