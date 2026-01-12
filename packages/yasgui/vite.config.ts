import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
import wasm from "vite-plugin-wasm";
// import topLevelAwait from "vite-plugin-top-level-await";
// import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  base: "./",
  build: {
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@sib-swiss/yasgui",
      fileName: "yasgui",
      formats: ["es"],
    },
    sourcemap: true,
    rollupOptions: {
      plugins: [typescript()],
      // external: ["@sib-swiss/yasqe"],
      output: {
        // This needs to be false to avoid issues with dynamic imports in the built library
        inlineDynamicImports: false,
      },
    },
    minify: false,
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    include: ["vscode-textmate", "vscode-oniguruma"],
    // include: ["@sib-swiss/yasqe"],
    exclude: [],
    // exclude: ["@sib-swiss/yasqe"],
  },
  resolve: {
    dedupe: ["vscode"],
  },
  plugins: [wasm()],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  esbuild: {
    minifySyntax: false,
  },
  // worker: {
  //   format: 'es'
  // },
  // worker: {
  //   format: "es",
  //   plugins: () => [
  //     wasm(),
  //     topLevelAwait(),
  //   ],
  // },
  // plugins: [
  //   wasm(),
  //   topLevelAwait(),
  // ],
  // esbuild: {
  //   minifySyntax: false
  // },
});
