import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Backend lives at http://localhost:3000 (see CivicTwinBackend/server.js).
      // Proxy keeps the frontend code provider-agnostic and avoids CORS in dev.
      "/ai": "http://localhost:3000",
      "/api": "http://localhost:3000",
    },
  },
});
