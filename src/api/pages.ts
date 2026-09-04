import { apiClient } from "./client";
import type {
  SiteSettings,
  SiteSettingsPayload,
  StaticPage,
  StaticPagePayload,
  PatchStaticPageRequest,
  PrivacyPolicyPage,
  PatchPrivacyPolicyPageRequest,
} from "../types/pages";

// Singleton resource — no id in the path, no list/create/delete.
const SETTINGS_URL = "/api/v1/admin/pages/settings/";
const STATIC_PAGES_URL = "/api/v1/admin/pages/static-pages/";
// A collection keyed by slug per the schema (GET/POST on the list,
// GET/PUT/PATCH/DELETE on /{slug}/), but the SITE only ever has exactly two
// legal documents. create/delete are deliberately not exposed here — a
// create flow is what produced the stray "" and "body" records that had to
// be filtered out of the list; this module only reads and edits.
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

  getPrivacyPolicyPages: () =>
    apiClient.get<PrivacyPolicyPage[]>(PRIVACY_POLICY_URL),

  getPrivacyPolicyPage: (slug: string) =>
    apiClient.get<PrivacyPolicyPage>(
      `${PRIVACY_POLICY_URL}${encodeURIComponent(slug)}/`,
    ),

  /**
   * The only write path this module exposes. PUT and POST/DELETE exist on
   * the schema too, but are deliberately not called here: PUT risks a caller
   * accidentally including (and thus changing) the slug, which this screen
   * never offers, and POST/DELETE would let someone create or remove one of
   * the site's two fixed legal documents.
   */
  patchPrivacyPolicyPage: (slug: string, data: PatchPrivacyPolicyPageRequest) =>
    apiClient.patch<PrivacyPolicyPage>(
      `${PRIVACY_POLICY_URL}${encodeURIComponent(slug)}/`,
      data,
    ),
};
