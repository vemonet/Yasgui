import { defineConfig } from "vite";
import { resolve } from "path";
import typescript from "@rollup/plugin-typescript";
import wasm from "vite-plugin-wasm";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

const isProd = process.env.NODE_ENV === "production";

/** Function to get alias for packages */
function getAliasFor(packageName: "yasgui" | "yasr" | "yasqe" | "utils") {
  const fullPackageName = packageName === "utils" ? "@zazuko/yasgui-utils" : `@zazuko/${packageName}`;
  const packagePath = resolve(__dirname, "packages", packageName, "src");
  return {
    [fullPackageName]: resolve(packagePath, "index.ts"),
  };
}

/** Function to get all entry points */
function getEntryPoints() {
  const entries: Record<string, string> = {};
  entries.yasgui = resolve(__dirname, "packages/yasgui/src/index.ts");
  entries.yasqe = resolve(__dirname, "packages/yasqe/src/index.ts");
  entries.yasr = resolve(__dirname, "packages/yasr/src/index.ts");
  entries.utils = resolve(__dirname, "packages/utils/src/index.ts");

  return entries;
}

export default defineConfig({
  // build: {
  //   lib: false, // We're building multiple entries, not a single library
  //   outDir: 'build',
  //   emptyOutDir: true,
  //   rollupOptions: {
  //     input: getEntryPoints(),
  //     output: {
  //       entryFileNames: (chunkInfo) => {
  //         const name = chunkInfo.name?.toLowerCase();
  //         return `${name}${isProd ? '.min' : ''}.js`;
  //       },
  //       chunkFileNames: (chunkInfo) => {
  //         const name = chunkInfo.name?.toLowerCase();
  //         return `${name}${isProd ? '.min' : ''}.js`;
  //       },
  //       assetFileNames: (assetInfo) => {
  //         if (assetInfo.name?.endsWith('.css')) {
  //           const name = assetInfo.name.replace('.css', '');
  //           return `${name}${isProd ? '.min' : ''}.css`;
  //         }
  //         return assetInfo.name || '';
  //       },
  //       format: 'umd',
  //       name: '[name]',
  //       globals: {
  //         // Define globals if needed for external dependencies
  //       }
  //     },
  //     plugins: [typescript()],
  //   },
  //   sourcemap: true,
  //   minify: isProd ? 'terser' : false,
  //   terserOptions: isProd ? {
  //     sourceMap: true,
  //   } : undefined,
  // },
  resolve: {
    alias: {
      ...getAliasFor("yasgui"),
      ...getAliasFor("yasr"),
      ...getAliasFor("yasqe"),
      ...getAliasFor("utils"),
    },
    extensions: [".json", ".js", ".ts", ".scss", ".css"],
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "sass:math";`,
      },
    },
  },
  define: {
    __DEVELOPMENT__: !isProd,
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [importMetaUrlPlugin],
    },
    // include: [
    // 	'vscode/localExtensionHost',
    // 	'vscode-textmate',
    // 	'vscode-oniguruma'
    // ]
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  server: {
    port: 4000,
    // host: '0.0.0.0',
  },
});
