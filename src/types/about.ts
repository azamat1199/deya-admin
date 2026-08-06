import type { LocalizedText } from "./common";

export type { LocalizedText };

export interface ExportRegion {
  id: number;
  name: string;
  position_x: string;
  position_y: string;
}

export type CreateExportRegionRequest = Omit<ExportRegion, "id">;

export type UpdateExportRegionRequest = CreateExportRegionRequest;

export type PatchExportRegionRequest = Partial<CreateExportRegionRequest>;

/**
 * Backend expects JSON: `title` is a JSON (multilingual) field and `image`
 * is a string (base64 data URL on upload, URL in responses).
 */
export interface Slide {
  id: number;
  // Response shape unconfirmed — may come back as a plain string instead
  // of the {uz, ru} object the write payload expects.
  title: LocalizedText | string;
  description: LocalizedText | string;
  image: string;
  order: number;
  is_active: boolean;
}

export interface SlidePayload {
  title: LocalizedText;
  description: LocalizedText;
  image?: string;
  order: number;
  is_active: boolean;
}

export type PatchSlideRequest = Partial<SlidePayload>;

/**
 * Fields unconfirmed — assumed shape (label + number, e.g. "500+ clients").
 * `title` follows the same {uz, ru} JSON convention as Slide; adjust if the
 * real API differs.
 */
export interface Stat {
  id: number;
  // Response shape unconfirmed — may come back as a plain string instead
  // of the {uz, ru} object the write payload expects.
  title: LocalizedText | string;
  value: string;
  is_active: boolean;
}

export interface StatPayload {
  title: LocalizedText;
  value: string;
  is_active: boolean;
}

export type PatchStatRequest = Partial<StatPayload>;

/**
 * No `order`/`is_active` (confirmed via Swagger) — unlike Slide/Stat, this
 * resource has no status toggle. `title`/`description` are JSONFields like
 * Slide/Stat: Swagger's schema shows "string" as a generic placeholder, but
 * real responses return {uz, ru} objects.
 */
export interface TimelineItem {
  id: number;
  year: number;
  title: LocalizedText | string;
  description: LocalizedText | string;
  image: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimelineItemPayload {
  year: number;
  title: string;
  description: string;
  image?: string;
}

export type PatchTimelineItemRequest = Partial<TimelineItemPayload>;
