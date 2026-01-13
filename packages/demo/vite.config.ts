import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  base: "/Yasgui/",
  build: {
    target: "esnext",
    assetsInlineLimit: 0,
    // Disable minification entirely for Monaco/VSCode API compatibility
    minify: false,
    rollupOptions: {
      output: {
        // Ensure proper module format for TLA support
        format: "es",
      },
      // external: [
      //   /^@codingame\/monaco-vscode-.*/,
      //   /^monaco-editor.*/,
      //   /^monaco-languageclient.*/,
      //   /^vscode$/,
      //   /^vscode-textmate$/,
      //   /^vscode-oniguruma$/,
      // ],
    },
  },
  resolve: {
    dedupe: [
      "vscode",
      // "@codingame/monaco-vscode-api",
      // "monaco-editor",
      // "monaco-languageclient",
    ],
  },
  optimizeDeps: {
    // Include worker-related packages for proper pre-bundling
    include: [
      "vscode-textmate",
      "vscode-oniguruma",
      // "@codingame/monaco-vscode-editor-api",
      // "@codingame/monaco-vscode-textmate-service-override",
    ],
    esbuildOptions: {
      plugins: [importMetaUrlPlugin],
    },
  },
  esbuild: {
    target: "esnext",
    minifySyntax: false,
  },
  plugins: [wasm()],
  worker: {
    format: "es",
    plugins: () => [wasm()],
    // rollupOptions: {
    //   output: {
    //     // Ensure workers are output as separate files, not inlined as data URLs
    //     inlineDynamicImports: false,
    //   },
    // },
  },
});
