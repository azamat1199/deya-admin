import type { Translatable } from "../api/i18n";

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
  address: Translatable;
  work_hours: Translatable;
  yandex_map_url: string;
  instagram_url: string;
  telegram_url: string;
  catalog_file: string;
  cookie_notice_text: Translatable;
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
  title: Translatable;
  body: Translatable;
}

export type PatchStaticPageRequest = Partial<StaticPagePayload>;
