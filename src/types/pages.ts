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
 * A legal document in the privacy-policy collection — keyed by SLUG, not id
 * (the resource has no id field). NOT a singleton: GET on the collection URL
 * returns an array. `title` and `body` are both translatable; `body` is
 * TipTap-authored HTML per locale. Timestamps are read-only.
 *
 * Live data currently holds two records: slug "" (real content, but an empty
 * slug makes its detail URL `.../privacy-policy//` — unroutable) and slug
 * "body" (junk). Neither matches the public routes /privacy-policy or
 * /personal-data-consent yet — filed with the backend.
 */
export interface PrivacyPolicyPage {
  slug: string;
  title: TranslatableInput;
  body: TranslatableInput;
  created_at: string;
  updated_at: string;
}

/**
 * Edit payload — PATCHed to /{slug}/. `slug` is deliberately absent: the
 * path already carries identity, so allowing it in the body would open a
 * silent-rename path that could break whatever public route points at the
 * old slug. This resource offers no rename.
 */
export type PatchPrivacyPolicyPageRequest = Partial<{
  title: TranslatableInput;
  body: TranslatableInput;
}>;
