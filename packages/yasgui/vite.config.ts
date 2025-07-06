import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
import wasm from "vite-plugin-wasm";
// import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  base: "./",
  build: {
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@zazuko/yasgui",
      fileName: "yasgui",
    },
    sourcemap: true,
    rollupOptions: {
      plugins: [typescript()],
      external: [],
      // output: {
      //   inlineDynamicImports: false,
      // },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "sass:math";`,
      },
    },
  },
  optimizeDeps: {
    include: [
      "vscode-textmate",
      "vscode-oniguruma",
      // "@zazuko/yasqe",
    ],
    // exclude: [],
    exclude: ["@zazuko/yasqe"],
    // esbuildOptions: {
    //   plugins: [importMetaUrlPlugin],
    // },
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  plugins: [wasm()],
});
