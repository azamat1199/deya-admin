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

/** Joins DRF's per-field message array into one readable string. */
function messageText(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(" ");
  return String(value);
}

/**
 * Flattens a DRF error body into "field: message" lines.
 *
 * Handles the three shapes this API actually returns:
 *   { "slug": ["..."] }                  -> "slug: ..."
 *   { "title": { "uz": ["..."] } }       -> "title.uz: ..."   (translatable)
 *   [ "..." ]                            -> "..."             (bare array,
 *                                           i.e. non_field_errors)
 *
 * The field name is always kept: a bare "Обязательное поле." with no field
 * attached is unactionable for an editor.
 */
function flattenApiErrors(data: unknown, prefix = ""): string[] {
  if (data == null) return [];
  if (Array.isArray(data)) {
    const text = messageText(data);
    return text ? [prefix ? `${prefix}: ${text}` : text] : [];
  }
  if (typeof data !== "object") {
    const text = String(data);
    return text ? [prefix ? `${prefix}: ${text}` : text] : [];
  }

  const lines: string[] = [];
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // non_field_errors carries no useful field name — show the message alone.
    const isNonField = key === "non_field_errors" || key === "detail";
    const path = isNonField ? prefix : prefix ? `${prefix}.${key}` : key;
    lines.push(...flattenApiErrors(value, path));
  }
  return lines;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === "string") return data.detail;

    const lines = flattenApiErrors(data);
    if (lines.length) return lines.join(" · ");

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
    if (field === "detail" || field === "non_field_errors") continue;

    // Translatable fields report either flattened ("title.uz": [...]) or
    // nested ({ title: { uz: [...] } }). Both must land on the per-locale
    // input so the error shows on the right language tab — an error the
    // editor cannot locate is as bad as no error at all.
    if (messages && typeof messages === "object" && !Array.isArray(messages)) {
      for (const [locale, nested] of Object.entries(
        messages as Record<string, unknown>,
      )) {
        setError(`${field}.${locale}` as Path<T>, {
          type: "server",
          message: messageText(nested),
        });
      }
      continue;
    }

    setError(field as Path<T>, { type: "server", message: messageText(messages) });
  }
}
