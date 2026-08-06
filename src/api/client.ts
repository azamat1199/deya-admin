import axios from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { clearToken, getToken } from "../utils/token";

// In dev, go through the Vite proxy (same-origin /api) to avoid the API's
// missing CORS headers — see the proxy comment in vite.config.ts. Production
// builds call VITE_API_URL directly.
export const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? "/" : import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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
