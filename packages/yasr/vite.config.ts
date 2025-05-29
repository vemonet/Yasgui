import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@sib-swiss/yasr",
      fileName: "yasr",
    },
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      plugins: [typescript()],
    },
  },
});
