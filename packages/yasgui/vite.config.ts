import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
import wasm from "vite-plugin-wasm";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    lib: {
      entry: "src/index.ts",
      name: "@sib-swiss/yasgui",
      fileName: "yasgui",
      formats: ["es"],
    },
    sourcemap: true,
    rollupOptions: {
      plugins: [typescript()],
      output: {
        format: "es",
        inlineDynamicImports: false,
      },
    },
    minify: false,
    assetsInlineLimit: 0,
  },
  resolve: {
    dedupe: ["vscode"],
  },
  optimizeDeps: {
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
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  plugins: [wasm()],
  esbuild: {
    minifySyntax: false,
    target: "esnext",
  },
});
