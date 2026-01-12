import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import typescript from "@rollup/plugin-typescript";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

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
      output: {
        // This needs to be false to properly handle dynamic imports in the built library
        inlineDynamicImports: false,
        format: "es",
        // dynamicImportInCjs: true,
        // Ensure all chunks are inlined to avoid path resolution issues
        // manualChunks: undefined,
      },
    },
    assetsInlineLimit: 0,
    minify: false,
  },
  resolve: {
    dedupe: ["vscode"],
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
    esbuildOptions: {
      // This plugin fixes import.meta.url resolution for monaco-vscode-api assets
      plugins: [importMetaUrlPlugin],
    },
  },
  plugins: [wasm()],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  esbuild: {
    minifySyntax: false,
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
