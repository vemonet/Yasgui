import { defineConfig } from "vite";
import { resolve } from "path";
import wasm from "vite-plugin-wasm";

/** Function to get alias for packages */
function getAliasFor(packageName: "yasgui" | "yasr" | "yasqe" | "utils") {
  const fullPackageName = packageName === "utils" ? "@zazuko/yasgui-utils" : `@zazuko/${packageName}`;
  const packagePath = resolve(__dirname, "packages", packageName, "src");
  return {
    // Handle deep imports like @zazuko/yasqe/src/editor/endpointMetadata
    [`${fullPackageName}/src`]: packagePath,
    // Handle root imports like @zazuko/yasqe
    [fullPackageName]: resolve(packagePath, "index.ts"),
  };
}

export default defineConfig({
  // Development server configuration
  server: {
    port: 4000,
  },
  logLevel: "info",
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
  optimizeDeps: {
    include: ["vscode-textmate", "vscode-oniguruma"],
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
});

// /** Build configuration for individual packages */
// const isProd = process.env.NODE_ENV === "production";
// const buildPackage = process.env.BUILD_PACKAGE as "yasgui" | "yasr" | "yasqe" | "utils";

// export default defineConfig(() => {
//   // Package build mode
//   if (buildPackage && ['yasgui', 'yasr', 'yasqe', 'utils'].includes(buildPackage)) {
//     const packagePath = resolve(__dirname, "packages", buildPackage);
//     const entryPath = resolve(packagePath, "src", "index.ts");

//     const globalNames = {
//       'yasgui': 'Yasgui',
//       'yasqe': 'Yasqe',
//       'yasr': 'Yasr',
//       'utils': 'YasguiUtils'
//     };

//     return {
//       build: {
//         lib: {
//           entry: entryPath,
//           name: globalNames[buildPackage],
//           fileName: () => buildPackage,
//           // fileName: (format: string) => {
//           //   const suffix = isProd ? '.min' : '';
//           //   return format === 'umd' ? `${buildPackage}${suffix}.js` : `${buildPackage}.${format}.js`;
//           // },
//           // formats: ['umd', 'es'],
//         },
//         outDir: resolve(packagePath, 'build'),
//         emptyOutDir: true,
//         sourcemap: true,
//         cssCodeSplit: false, // Don't split CSS, bundle it together
//         minify: isProd ? 'terser' : false,
//         rollupOptions: {
//           // Only externalize peer dependencies, bundle everything else
//           external: buildPackage === 'utils' ? [] : ['@zazuko/yasgui-utils'],
//           output: {
//             globals: buildPackage === 'utils' ? undefined : {
//               '@zazuko/yasgui-utils': 'YasguiUtils'
//             },
//             assetFileNames: (assetInfo) => {
//               if (assetInfo.name?.endsWith('.css')) {
//                 const suffix = isProd ? '.min' : '';
//                 return `${buildPackage}${suffix}.css`;
//               }
//               return assetInfo.name || '';
//             },
//             // Prevent code splitting by putting everything in a single chunk
//             manualChunks: undefined,
//           },
//         },
//       },
//       resolve: {
//         alias: {
//           ...getAliasFor("yasgui"),
//           ...getAliasFor("yasr"),
//           ...getAliasFor("yasqe"),
//           ...getAliasFor("utils"),
//         },
//         extensions: [".json", ".js", ".ts", ".scss", ".css"],
//       },
//       css: {
//         preprocessorOptions: {
//           scss: {
//             additionalData: `@use "sass:math";`,
//           },
//         },
//       },
//       define: {
//         __DEVELOPMENT__: !isProd,
//       },
//       optimizeDeps: {
//         esbuildOptions: {
//           plugins: [importMetaUrlPlugin],
//         },
//         include: [
//           'vscode-textmate',
//           'vscode-oniguruma',
//         ],
//         exclude: [],
//       },
//       worker: {
//         format: "es",
//         plugins: () => [wasm()],
//       },
//       logLevel: 'info',
//     };
//   }

//   // Development server configuration
//   return {
//     resolve: {
//       alias: {
//         ...getAliasFor("yasgui"),
//         ...getAliasFor("yasr"),
//         ...getAliasFor("yasqe"),
//         ...getAliasFor("utils"),
//       },
//       extensions: [".json", ".js", ".ts", ".scss", ".css"],
//     },
//     css: {
//       preprocessorOptions: {
//         scss: {
//           additionalData: `@use "sass:math";`,
//         },
//       },
//     },
//     define: {
//       __DEVELOPMENT__: !isProd,
//     },
//     optimizeDeps: {
//       esbuildOptions: {
//         plugins: [importMetaUrlPlugin],
//       },
//       include: [
//         'vscode-textmate',
//         'vscode-oniguruma',
//       ],
//       exclude: [],
//     },
//     worker: {
//       format: "es",
//       plugins: () => [wasm()],
//     },
//     server: {
//       port: 4000,
//       sourcemapIgnoreList: (sourcePath) => {
//         return sourcePath.includes('node_modules');
//       },
//     },
//     logLevel: 'info',
//   };
// });
