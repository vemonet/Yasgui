import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import typescript from "@rollup/plugin-typescript";
// import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

// https://github.com/TypeFox/monaco-languageclient/issues/950
export default defineConfig({
  base: "./",
  assetsInclude: ["**/*.wasm"],
  build: {
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@sib-swiss/yasqe",
      fileName: "yasqe",
      formats: ["es"],
    },
    sourcemap: true,
    // cssCodeSplit: true, // Causes out of memory error
    rollupOptions: {
      plugins: [typescript()],
      // external: ['monaco-editor-workers'],
      // external: ["@codingame/monaco-editor-wrapper"],
      output: {
        // This needs to be true otherwise we get error
        inlineDynamicImports: true,
        // But we need to make this false to properly handle dynamic imports in the built library
        // inlineDynamicImports: false,
        // Ensure proper format for dynamic imports
        format: "es",
        // dynamicImportInCjs: true,
        // Ensure all chunks are inlined to avoid path resolution issues
        // manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: [
      "vscode-textmate",
      "vscode-oniguruma",
      // "@codingame/monaco-vscode-api",
      // "monaco-editor-wrapper",
      // Explicitly include the service overrides to ensure they're bundled
      // "@codingame/monaco-vscode-editor-service-override",
      // "@codingame/monaco-vscode-workbench-service-override",
      // "@codingame/monaco-vscode-views-service-override",
      // "qlue-ls",
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
  // esbuild: {
  //   minifySyntax: false
  // },
  // resolve: {
  //   alias: {
  //     // Ensure vscode modules resolve correctly
  //     "vscode": "@codingame/monaco-vscode-extension-api"
  //   }
  // },
});
