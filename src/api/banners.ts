import { apiClient } from "./client";
import type {
  Banner,
  BannerPayload,
  PatchBannerRequest,
  PatchMainTextRequest,
} from "../types/banners";

const BANNERS_URL = "/api/v1/admin/pages/banners/";

export const bannersApi = {
  getBanners: () => apiClient.get<Banner[]>(BANNERS_URL),

  getBanner: (id: number) => apiClient.get<Banner>(`${BANNERS_URL}${id}/`),

  createBanner: (data: BannerPayload) => apiClient.post<Banner>(BANNERS_URL, data),

  /**
   * The only edit path exposed here. PUT exists on the schema too, but is
   * deliberately not exposed: a full replace risks a caller accidentally
   * re-sending the display image URL or clobbering a field it didn't
   * load — the same reasoning pages/privacy-policy's API layer uses.
   *
   * Accepts PatchMainTextRequest too: the type="main_text" record is the
   * same resource at the same URL, just a different editable field set —
   * no second endpoint, so no second function.
   */
  patchBanner: (id: number, data: PatchBannerRequest | PatchMainTextRequest) =>
    apiClient.patch<Banner>(`${BANNERS_URL}${id}/`, data),

  deleteBanner: (id: number) => apiClient.delete<void>(`${BANNERS_URL}${id}/`),
};
