import axios from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { clearToken, getToken } from "../utils/token";

// Vite inlines VITE_-prefixed vars at BUILD time, not runtime — a value that
// exists only in a local .env file is invisible to a CI build container.
// Dev  → "" so requests stay same-origin and the Vite proxy handles them
//         (see the proxy comment in vite.config.ts).
// Prod → VITE_API_URL, which must be an absolute backend origin.
// Trailing slashes are stripped so the base never doubles up with the leading
// slash that every path constant already carries.
const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

// A missing base must never silently fall back to the page's own origin —
// that points every request at the static host instead of the API, which
// returns HTML and fails in confusing ways. vite.config.ts also fails the
// build for this, so reaching here means a bundle was built some other way.
if (!import.meta.env.DEV && !API_BASE_URL) {
  throw new Error(
    "VITE_API_URL is not set. This production build has no backend origin, " +
      "so API requests would hit this site's own origin instead of the API. " +
      "Set VITE_API_URL (e.g. https://deya.uz) in the deploy environment and " +
      "rebuild — Vite inlines it at build time.",
  );
}

// Declared here rather than imported from ../i18n so the api layer does not
// pull in the i18next init side-effect. Must match src/i18n/index.ts.
const LANGUAGE_KEY = "deya_admin_language";
const DEFAULT_LANGUAGE = "uz";

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // The API honours Accept-Language (?lang= is ignored), so list endpoints
  // that resolve server-side come back in the admin's chosen language. Edit
  // forms still load the full { uz, ru, en } object, so this only affects
  // which language a resolved read shows — never what a save writes.
  // Read from storage rather than importing i18n to keep this module free of
  // UI dependencies; falls back to the app default.
  const language = localStorage.getItem(LANGUAGE_KEY);
  config.headers["Accept-Language"] = language || DEFAULT_LANGUAGE;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === "string") return data.detail;
    if (data && typeof data === "object") {
      const firstField = Object.values(data).find(
        (v) => typeof v === "string" || Array.isArray(v),
      );
      if (Array.isArray(firstField)) return String(firstField[0]);
      if (typeof firstField === "string") return firstField;
    }
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}

/**
 * Maps DRF-style field validation errors (e.g. { name: ["This field is
 * required."] }) from a failed request onto react-hook-form field errors.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  if (!axios.isAxiosError(error)) return;
  const data = error.response?.data;
  if (!data || typeof data !== "object") return;

  for (const [field, messages] of Object.entries(data)) {
    if (field === "detail") continue;
    const message = Array.isArray(messages) ? String(messages[0]) : String(messages);
    setError(field as Path<T>, { type: "server", message });
  }
}
