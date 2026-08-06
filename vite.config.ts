import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
    // taxify.uz sends no Access-Control-Allow-Origin header, so the browser
    // blocks direct calls in dev. Proxy same-origin /api/* requests to it
    // server-side to avoid CORS. Production still needs the backend to
    // allow the deployed admin origin, or to be served same-origin.
    proxy: {
      "/api": {
        target: "https://taxify.uz",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
