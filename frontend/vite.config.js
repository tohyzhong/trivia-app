import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
dotenv.config();

console.log("VITE_API_URL:", process.env.VITE_API_URL);

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
  server: {
    proxy: {
      "/api": process.env.VITE_API_URL
    }
  },
  assetsInclude: ["**/*.jpg", "**/*.png"]
});
