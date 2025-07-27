import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  build: {
    assetsDir: "assets",
    manifest: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]"
      }
    }
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    css: true,
    coverage: {
      provider: "c8", // use c8 coverage provider
      reporter: ["text", "json", "html"], // generate text, json and html reports
      reportsDirectory: "./coverage",
      exclude: ["node_modules/", "test/"] // customize exclude as needed
    }
  },
  server: {
    proxy: {
      "/api": "http://localhost:8080"
    }
  },
  assetsInclude: ["**/*.jpg", "**/*.png"]
});
