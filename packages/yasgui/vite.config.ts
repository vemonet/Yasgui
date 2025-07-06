import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
// import wasm from "vite-plugin-wasm";
// import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  // base: './',
  build: {
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@zazuko/yasgui",
      fileName: "yasgui",
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
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "sass:math";`,
      },
    },
  },
  optimizeDeps: {
    // esbuildOptions: {
    //   plugins: [importMetaUrlPlugin],
    // },
    include: ["vscode-textmate", "vscode-oniguruma", "@zazuko/yasqe"],
    // exclude: ['@zazuko/yasqe'],
  },
  // worker: {
  //   format: "es",
  //   plugins: () => [wasm()],
  // },
  // plugins: [
  //   wasm(),
  // ],
});
