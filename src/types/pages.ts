import type { Translatable, TranslatableInput } from "../api/i18n";

export interface SiteSettings {
  phone: string;
  hotline: string;
  email: string;
  address: Translatable | string;
  work_hours: Translatable | string;
  yandex_map_url: string;
  instagram_url: string;
  telegram_url: string;
  catalog_file: string;
  cookie_notice_text: Translatable | string;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingsPayload {
  phone: string;
  hotline: string;
  email: string;
  address: TranslatableInput;
  work_hours: TranslatableInput;
  yandex_map_url: string;
  instagram_url: string;
  telegram_url: string;
  catalog_file: string;
  cookie_notice_text: TranslatableInput;
}

export interface StaticPage {
  id: number;
  slug: string;
  title: Translatable | string;
  // HTML string from the TipTap editor, per locale.
  body: Translatable | string;
  created_at: string;
  updated_at: string;
}

export interface StaticPagePayload {
  slug: string;
  title: TranslatableInput;
  body: TranslatableInput;
}

export type PatchStaticPageRequest = Partial<StaticPagePayload>;

/**
 * Singleton privacy-policy document. `title` is a plain string per locale;
 * `body` is rich-text HTML per locale (numbered sections, bold headings,
 * lists and links). Timestamps are read-only and never sent back.
 */
export interface PrivacyPolicy {
  title: TranslatableInput;
  body: TranslatableInput;
  created_at: string;
  updated_at: string;
}

/** Write shape — deliberately omits created_at / updated_at. */
export interface PrivacyPolicyPayload {
  title: TranslatableInput;
  body: TranslatableInput;
}

export type PatchPrivacyPolicyRequest = Partial<PrivacyPolicyPayload>;
