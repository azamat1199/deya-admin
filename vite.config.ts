import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API_TARGET = "https://deya.uz";

export default defineConfig(({ command, mode }) => {
  // Reads .env files *and* matching vars already in process.env, which is how
  // CI providers (Netlify, Vercel) supply them.
  const env = loadEnv(mode, process.cwd(), "VITE_");

  // Vite inlines VITE_API_URL at build time. Without it, axios has no base
  // and every request falls back to the deployed site's own origin — hitting
  // the static host instead of the API. Fail the build here so that surfaces
  // in CI rather than in production.
  if (command === "build" && !env.VITE_API_URL) {
    throw new Error(
      "VITE_API_URL is not set — refusing to build. The bundle would have no " +
        `backend origin and every API request would hit the site's own ` +
        `origin instead of the API. Set VITE_API_URL (e.g. ${API_TARGET}) in ` +
        "the build environment; for Netlify it is in netlify.toml under " +
        "[build.environment].",
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3001,
      // Proxy /api/* to the backend server-side so dev requests stay
      // same-origin and never depend on CORS headers. Whether deya.uz sends
      // Access-Control-Allow-Origin is unverified, so this stays as a
      // precaution. Production calls the backend directly via VITE_API_URL,
      // so it still needs the backend to allow the deployed admin origin.
      proxy: {
        "/api": {
          target: API_TARGET,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
