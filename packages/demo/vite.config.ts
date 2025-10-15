import { defineConfig } from "vite";

export default defineConfig({
  base: "/Yasgui/",
  // server: {
  //   port: 3000,
  // },
  worker: {
    format: "es",
  },
  // esbuild: {
  //   minifySyntax: false
  // }
});
