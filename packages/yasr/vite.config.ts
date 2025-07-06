import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
  build: {
    outDir: "dist",
    target: ["es2020"],
    lib: {
      entry: "src/index.ts",
      name: "@zazuko/yasr",
      fileName: "yasr",
    },
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      plugins: [typescript()],
    },
  },
});
