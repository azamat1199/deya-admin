import type { Translatable } from "../api/i18n";

/**
 * `title` and `text` are multilingual: the API returns and expects
 * { uz, ru, en } objects, not strings. Never render them directly — pass
 * them through tr() from types/i18n.ts first. `image` is a plain URL string
 * and is not translated.
 */
export interface CareerValue {
  id: number;
  title: Translatable | string;
  text: Translatable | string;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface CareerValuePayload {
  title: Translatable;
  text: Translatable;
  image?: string;
}

export type PatchCareerValueRequest = Partial<CareerValuePayload>;

export interface Company {
  id: number;
  name: Translatable | string;
  slug: string;
  description: Translatable | string;
  image: string;
  vacancies_url: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyPayload {
  name: Translatable;
  slug: string;
  description: Translatable;
  image?: string;
  vacancies_url: string;
}

export type PatchCompanyRequest = Partial<CompanyPayload>;
