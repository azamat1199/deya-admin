import type { Translatable, TranslatableInput } from "../api/i18n";

export interface ExportRegion {
  id: number;
  name: Translatable | string;
  position_x: string;
  position_y: string;
}

export interface ExportRegionPayload {
  name: TranslatableInput;
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
  title: TranslatableInput;
  description: TranslatableInput;
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
  label: TranslatableInput;
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
  title: TranslatableInput;
  description: TranslatableInput;
  image?: string;
}

export type PatchTimelineItemRequest = Partial<TimelineItemPayload>;

/**
 * Singleton FounderStory block on the public /about page.
 *
 * Four translatable fields plus ONE shared photo — `image` is a flat string,
 * not a locale dict, so it belongs outside the RU/UZ/EN tabs.
 * Timestamps are read-only and never sent back.
 */
export interface Factory {
  title: TranslatableInput;
  subtitle: TranslatableInput;
  description: TranslatableInput;
  subdescription: TranslatableInput;
  image: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Write shape — omits created_at / updated_at.
 *
 * `image` is optional on purpose: omit the key to leave the stored photo
 * alone, send null to clear it. Never re-send the existing URL unchanged.
 */
export interface FactoryPayload {
  title: TranslatableInput;
  subtitle: TranslatableInput;
  description: TranslatableInput;
  subdescription: TranslatableInput;
  image?: string | null;
}

export type PatchFactoryRequest = Partial<FactoryPayload>;
