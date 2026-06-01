/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // publicDir serves the repo-root assets/ folder at the URL root.
  // Files in assets/tiles/… are served at /tiles/…, etc.
  publicDir: "../../assets",
  server: {
    port: Number(process.env.WEB_PORT ?? 5173),
    proxy: {
      "/api": { target: "http://localhost:8787", rewrite: (p) => p.replace(/^\/api/, "") },
      "/ws": { target: "ws://localhost:8787", ws: true },
    },
  },
  test: { environment: "jsdom" },
});
