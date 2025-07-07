import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import typescript from "@rollup/plugin-typescript";
// import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig({
  base: "./",
  assetsInclude: ["**/*.wasm"],
  build: {
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@sib-swiss/yasqe",
      fileName: "yasqe",
    },
    sourcemap: true,
    // cssCodeSplit: true, //  Trigger oom
    rollupOptions: {
      plugins: [typescript()],
      external: [],
      output: {
        // Enable cleaner file structure
        inlineDynamicImports: true,
        // Ensure proper format for dynamic imports
        format: "es",
        // Ensure proper asset file names
        // assetFileNames: (assetInfo) => {
        //   if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
        //   const info = assetInfo.name.split('.');
        //   const extType = info[info.length - 1];
        //   if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
        //     return `assets/img/[name]-[hash][extname]`;
        //   }
        //   if (/wasm/i.test(extType)) {
        //     return `assets/wasm/[name]-[hash][extname]`;
        //   }
        //   return `assets/[name]-[hash][extname]`;
        // },
        // chunkFileNames: 'assets/[name]-[hash].js',
        // entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  optimizeDeps: {
    include: [
      "vscode-textmate",
      "vscode-oniguruma",
      "monaco-editor/esm/vs/editor/editor.worker",
      "monaco-editor/esm/vs/language/json/json.worker",
      "monaco-editor/esm/vs/language/css/css.worker",
      "monaco-editor/esm/vs/language/html/html.worker",
      "monaco-editor/esm/vs/language/typescript/ts.worker",
      "qlue-ls",
      // "monaco-editor",
      // "monaco-editor-wrapper",
    ],
    exclude: [
      // "qlue-ls"
    ],
    // esbuildOptions: {
    //   plugins: [importMetaUrlPlugin],
    // },
  },
  plugins: [wasm(), topLevelAwait()],
  worker: {
    format: "es",
    plugins: () => [wasm(), topLevelAwait()],
  },
});
