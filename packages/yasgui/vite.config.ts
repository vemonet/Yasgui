import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
// import wasm from "vite-plugin-wasm";
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
  },
  optimizeDeps: {
    // include: ["vscode-textmate", "vscode-oniguruma"],
    // include: ["@sib-swiss/yasqe"],
    exclude: [],
    // exclude: ["@sib-swiss/yasqe"],
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
