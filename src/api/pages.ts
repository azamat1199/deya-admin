import { apiClient } from "./client";
import type {
  SiteSettings,
  SiteSettingsPayload,
  StaticPage,
  StaticPagePayload,
  PatchStaticPageRequest,
  PrivacyPolicy,
  PrivacyPolicyPayload,
  PatchPrivacyPolicyRequest,
} from "../types/pages";

// Singleton resource — no id in the path, no list/create/delete.
const SETTINGS_URL = "/api/v1/admin/pages/settings/";
const STATIC_PAGES_URL = "/api/v1/admin/pages/static-pages/";
// Singleton too — retrieve + update only, no id segment. Trailing slash
// is required (Django APPEND_SLASH 301s the slashless form).
const PRIVACY_POLICY_URL = "/api/v1/admin/pages/privacy-policy/";

export const pagesApi = {
  getSettings: () => apiClient.get<SiteSettings>(SETTINGS_URL),

  updateSettings: (data: SiteSettingsPayload) =>
    apiClient.put<SiteSettings>(SETTINGS_URL, data),

  getStaticPages: () => apiClient.get<StaticPage[]>(STATIC_PAGES_URL),

  getStaticPage: (id: number) =>
    apiClient.get<StaticPage>(`${STATIC_PAGES_URL}${id}/`),

  createStaticPage: (data: StaticPagePayload) =>
    apiClient.post<StaticPage>(STATIC_PAGES_URL, data),

  updateStaticPage: (id: number, data: StaticPagePayload) =>
    apiClient.put<StaticPage>(`${STATIC_PAGES_URL}${id}/`, data),

  patchStaticPage: (id: number, data: PatchStaticPageRequest) =>
    apiClient.patch<StaticPage>(`${STATIC_PAGES_URL}${id}/`, data),

  deleteStaticPage: (id: number) =>
    apiClient.delete<void>(`${STATIC_PAGES_URL}${id}/`),

  getPrivacyPolicy: () => apiClient.get<PrivacyPolicy>(PRIVACY_POLICY_URL),

  /** Default write path: sends only what changed. */
  patchPrivacyPolicy: (data: PatchPrivacyPolicyRequest) =>
    apiClient.patch<PrivacyPolicy>(PRIVACY_POLICY_URL, data),

  /** Deliberate full replace only — prefer patchPrivacyPolicy. */
  updatePrivacyPolicy: (data: PrivacyPolicyPayload) =>
    apiClient.put<PrivacyPolicy>(PRIVACY_POLICY_URL, data),
};
