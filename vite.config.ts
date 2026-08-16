import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
    // Proxy /api/* to the backend server-side so dev requests stay
    // same-origin and never depend on CORS headers. Whether deya.uz sends
    // Access-Control-Allow-Origin is unverified, so this stays as a
    // precaution. Production still needs the backend to allow the deployed
    // admin origin, or to be served same-origin.
    proxy: {
      "/api": {
        target: "https://deya.uz",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
