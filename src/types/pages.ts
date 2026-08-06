export interface SiteSettings {
  phone: string;
  hotline: string;
  email: string;
  address: string;
  work_hours: string;
  yandex_map_url: string;
  instagram_url: string;
  telegram_url: string;
  catalog_file: string;
  cookie_notice_text: string;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingsPayload {
  phone: string;
  hotline: string;
  email: string;
  address: string;
  work_hours: string;
  yandex_map_url: string;
  instagram_url: string;
  telegram_url: string;
  catalog_file: string;
  cookie_notice_text: string;
}

export interface StaticPage {
  id: number;
  slug: string;
  title: string;
  // HTML string from the TipTap editor — assumed to be how the public
  // site renders this field; unconfirmed since the public site/Swagger
  // weren't reachable to verify. Swap the editor if that's wrong.
  body: string;
  created_at: string;
  updated_at: string;
}

export interface StaticPagePayload {
  slug: string;
  title: string;
  body: string;
}

export type PatchStaticPageRequest = Partial<StaticPagePayload>;
