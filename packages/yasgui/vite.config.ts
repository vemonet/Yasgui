import { defineConfig } from "vite";
// import wasm from "vite-plugin-wasm";
// import topLevelAwait from "vite-plugin-top-level-await";
import typescript from "@rollup/plugin-typescript";
// import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  base: "./",
  build: {
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@sib-swiss/yasgui",
      fileName: "yasgui",
    },
    sourcemap: true,
    rollupOptions: {
      plugins: [typescript()],
      external: ["@sib-swiss/yasqe"],
      output: {
        inlineDynamicImports: true,
      },
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
      // "@sib-swiss/yasqe",
    ],
    // exclude: [],
    exclude: ["@sib-swiss/yasqe"],
    // esbuildOptions: {
    //   plugins: [importMetaUrlPlugin],
    // },
  },
  // plugins: [
  //   wasm(),
  //   topLevelAwait(),
  // ],
  // worker: {
  //   format: "es",
  //   plugins: () => [
  //     wasm(),
  //     topLevelAwait(),
  //   ],
  // },
});
