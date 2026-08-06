import { apiClient } from "./client";
import type {
  SiteSettings,
  SiteSettingsPayload,
  StaticPage,
  StaticPagePayload,
  PatchStaticPageRequest,
} from "../types/pages";

// Singleton resource — no id in the path, no list/create/delete.
const SETTINGS_URL = "/api/v1/admin/pages/settings/";
const STATIC_PAGES_URL = "/api/v1/admin/pages/static-pages/";

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
};
