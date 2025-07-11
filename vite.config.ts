import { defineConfig, type LogLevel } from "vite";
import { resolve } from "path";
import wasm from "vite-plugin-wasm";

/** Function to get alias for packages */
function getAliasFor(packageName: "yasgui" | "yasr" | "yasqe" | "utils") {
  const fullPackageName = packageName === "utils" ? "@sib-swiss/yasgui-utils" : `@sib-swiss/${packageName}`;
  const packagePath = resolve(__dirname, "packages", packageName, "src");
  return {
    // Handle deep imports like @zazuko/yasqe/src/editor/endpointMetadata
    [`${fullPackageName}/src`]: packagePath,
    // Handle root imports like @zazuko/yasqe
    [fullPackageName]: resolve(packagePath, "index.ts"),
  };
}

// https://vitejs.dev/config/
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
    dedupe: ["vscode"],
  },
  optimizeDeps: {
    include: ["vscode-textmate", "vscode-oniguruma"],
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  // plugins: [wasm()],
});

/** Build configuration for all packages */
// "all:build": "BUILD_PACKAGE=yasgui-utils vite build && BUILD_PACKAGE=yasqe vite build && BUILD_PACKAGE=yasr vite build && BUILD_PACKAGE=yasgui vite build",
// const isProd = process.env.NODE_ENV === "production";
// const buildPackage = process.env.BUILD_PACKAGE as "yasgui" | "yasr" | "yasqe" | "utils";
// const pkgName = (pkgFolder: string) => {
//   return pkgFolder !== "utils" ? `@sib-swiss/${pkgFolder}` : `@sib-swiss/yasgui-${pkgFolder}`;
// };

// export default defineConfig(() => {
//   // Package build mode
//   if (buildPackage && ["yasgui", "yasr", "yasqe", "utils"].includes(buildPackage)) {
//     const packagePath = resolve(__dirname, "packages", buildPackage);
//     const entryPath = resolve(packagePath, "src", "index.ts");
//     return {
//       build: {
//         lib: {
//           entry: entryPath,
//           name: pkgName(buildPackage),
//           fileName: buildPackage,
//         },
//         outDir: resolve(packagePath, "dist"),
//         emptyOutDir: true,
//         sourcemap: true,
//         cssCodeSplit: false, // Don't split CSS, bundle it together
//         rollupOptions: {
//           // Only externalize peer dependencies, bundle everything else
//           external: buildPackage === "utils" ? [] : ["@sib-swiss/yasgui-utils"],
//           output: {
//             // Enable cleaner file structure
//             inlineDynamicImports: true,
//             // Ensure proper format for dynamic imports
//             format: "es" as const,
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
//       define: {
//         __DEVELOPMENT__: !isProd,
//       },
//       optimizeDeps: {
//         include: ["vscode-textmate", "vscode-oniguruma"],
//         exclude: [],
//       },
//       worker: {
//         format: "es" as const,
//         plugins: () => [wasm()],
//       },
//       logLevel: "info" as LogLevel,
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
//     define: {
//       __DEVELOPMENT__: !isProd,
//     },
//     optimizeDeps: {
//       include: ["vscode-textmate", "vscode-oniguruma"],
//       exclude: [],
//     },
//     worker: {
//       format: "es" as const,
//       plugins: () => [wasm()],
//     },
//     server: {
//       port: 4000,
//     },
//     logLevel: "info" as LogLevel,
//   };
// });
