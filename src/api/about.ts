import { apiClient } from "./client";
import type {
  ExportRegion,
  CreateExportRegionRequest,
  UpdateExportRegionRequest,
  PatchExportRegionRequest,
  Slide,
  SlidePayload,
  PatchSlideRequest,
  Stat,
  StatPayload,
  PatchStatRequest,
  TimelineItem,
  TimelineItemPayload,
  PatchTimelineItemRequest,
} from "../types/about";

const REGIONS_URL = "/api/v1/admin/about/export-regions/";
const SLIDES_URL = "/api/v1/admin/about/slides/";
const STATS_URL = "/api/v1/admin/about/stats/";
const TIMELINE_URL = "/api/v1/admin/about/timeline/";

export const aboutApi = {
  getExportRegions: () => apiClient.get<ExportRegion[]>(REGIONS_URL),

  getExportRegion: (id: number) =>
    apiClient.get<ExportRegion>(`${REGIONS_URL}${id}/`),

  createExportRegion: (data: CreateExportRegionRequest) =>
    apiClient.post<ExportRegion>(REGIONS_URL, data),

  updateExportRegion: (id: number, data: UpdateExportRegionRequest) =>
    apiClient.put<ExportRegion>(`${REGIONS_URL}${id}/`, data),

  patchExportRegion: (id: number, data: PatchExportRegionRequest) =>
    apiClient.patch<ExportRegion>(`${REGIONS_URL}${id}/`, data),

  deleteExportRegion: (id: number) =>
    apiClient.delete<void>(`${REGIONS_URL}${id}/`),

  // The API expects a plain JSON body — `title`/`description` are JSON
  // (multilingual) fields and `image` is a string (base64 data URL on
  // write), not a multipart file upload.
  getSlides: () => apiClient.get<Slide[]>(SLIDES_URL),

  getSlide: (id: number) => apiClient.get<Slide>(`${SLIDES_URL}${id}/`),

  createSlide: (data: SlidePayload) => apiClient.post<Slide>(SLIDES_URL, data),

  updateSlide: (id: number, data: SlidePayload) =>
    apiClient.put<Slide>(`${SLIDES_URL}${id}/`, data),

  patchSlide: (id: number, data: PatchSlideRequest) =>
    apiClient.patch<Slide>(`${SLIDES_URL}${id}/`, data),

  deleteSlide: (id: number) => apiClient.delete<void>(`${SLIDES_URL}${id}/`),

  getStats: () => apiClient.get<Stat[]>(STATS_URL),

  getStat: (id: number) => apiClient.get<Stat>(`${STATS_URL}${id}/`),

  createStat: (data: StatPayload) => apiClient.post<Stat>(STATS_URL, data),

  updateStat: (id: number, data: StatPayload) =>
    apiClient.put<Stat>(`${STATS_URL}${id}/`, data),

  patchStat: (id: number, data: PatchStatRequest) =>
    apiClient.patch<Stat>(`${STATS_URL}${id}/`, data),

  deleteStat: (id: number) => apiClient.delete<void>(`${STATS_URL}${id}/`),

  getTimeline: () => apiClient.get<TimelineItem[]>(TIMELINE_URL),

  getTimelineItem: (id: number) =>
    apiClient.get<TimelineItem>(`${TIMELINE_URL}${id}/`),

  createTimelineItem: (data: TimelineItemPayload) =>
    apiClient.post<TimelineItem>(TIMELINE_URL, data),

  updateTimelineItem: (id: number, data: TimelineItemPayload) =>
    apiClient.put<TimelineItem>(`${TIMELINE_URL}${id}/`, data),

  patchTimelineItem: (id: number, data: PatchTimelineItemRequest) =>
    apiClient.patch<TimelineItem>(`${TIMELINE_URL}${id}/`, data),

  deleteTimelineItem: (id: number) =>
    apiClient.delete<void>(`${TIMELINE_URL}${id}/`),
};
