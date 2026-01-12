import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  base: "/Yasgui/",
  resolve: {
    // CRITICAL: Dedupe vscode and monaco packages to avoid version conflicts
    dedupe: [
      "vscode",
      // "@codingame/monaco-vscode-api",
      // "monaco-editor",
      // "monaco-languageclient",
    ],
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 0,
    // Disable minification entirely for Monaco/VSCode API compatibility
    minify: false,
    // rollupOptions: {
    //   output: {
    //     // Use ES format which natively supports top-level await
    //     format: "es",
    //     // Ensure proper initialization order by not hoisting exports
    //     hoistTransitiveImports: false,
    //   },
    // },
  },
  optimizeDeps: {
    include: ["vscode-textmate", "vscode-oniguruma"],
    esbuildOptions: {
      plugins: [importMetaUrlPlugin],
    },
  },
  // CRITICAL: Disable esbuild minification for Monaco/VSCode API
  // Without this, minification breaks function references (e.g., "MG is not a function")
  esbuild: {
    // target: "esnext",
    minifySyntax: false,
  },
  plugins: [wasm()],
});
