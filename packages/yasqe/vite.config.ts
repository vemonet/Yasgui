import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import typescript from "@rollup/plugin-typescript";
// import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  base: "./",
  build: {
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@zazuko/yasqe",
      fileName: "yasqe",
    },
    sourcemap: true,
    // cssCodeSplit: true,
    rollupOptions: {
      plugins: [typescript()],
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "vscode-textmate",
      "vscode-oniguruma",
      // "monaco-editor",
      // "monaco-editor-wrapper",
    ],
    // esbuildOptions: {
    //   plugins: [importMetaUrlPlugin],
    // },
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  // plugins: [
  //   wasm(),
  // ],
});
