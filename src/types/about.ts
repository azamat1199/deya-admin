import type { Translatable } from "../api/i18n";

export interface ExportRegion {
  id: number;
  name: Translatable | string;
  position_x: string;
  position_y: string;
}

export interface ExportRegionPayload {
  name: Translatable;
  position_x: string;
  position_y: string;
}

export type CreateExportRegionRequest = ExportRegionPayload;

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
  title: Translatable | string;
  description: Translatable | string;
  image: string;
  order: number;
  is_active: boolean;
}

export interface SlidePayload {
  title: Translatable;
  description: Translatable;
  image?: string;
  order: number;
  is_active: boolean;
}

export type PatchSlideRequest = Partial<SlidePayload>;

/** A homepage statistic: a number (`value`) with a caption (`label`). */
export interface Stat {
  id: number;
  // `label` is the caption under the number and IS translatable.
  // `value` is the number itself ("32+", "25") — identical in every
  // language, so it stays a plain string.
  label: Translatable | string;
  value: string;
  is_active: boolean;
  // Read-only — never sent in a write payload.
  created_at?: string;
  updated_at?: string;
}

export interface StatPayload {
  label: Translatable;
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
  title: Translatable | string;
  description: Translatable | string;
  image: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimelineItemPayload {
  year: number;
  title: Translatable;
  description: Translatable;
  image?: string;
}

export type PatchTimelineItemRequest = Partial<TimelineItemPayload>;
