import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: [
                "electron",
                "electron-store",
                "sqlite3",
                "better-sqlite3",
              ],
              output: {
                format: "cjs", // Ensure CommonJS output format for Electron
              },
            },
          },
        },
      },
      {
        entry: "electron/preload.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              output: {
                format: "cjs", // Ensure CommonJS for preload too
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
