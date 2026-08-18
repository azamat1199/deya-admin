import type { Translated } from "./i18n";

/**
 * `title` and `text` are multilingual: the API returns and expects
 * { uz, ru, en } objects, not strings. Never render them directly — pass
 * them through tr() from types/i18n.ts first. `image` is a plain URL string
 * and is not translated.
 */
export interface CareerValue {
  id: number;
  title: Translated;
  text: Translated;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface CareerValuePayload {
  title: Translated;
  text: Translated;
  image?: string;
}

export type PatchCareerValueRequest = Partial<CareerValuePayload>;

export interface Company {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  vacancies_url: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyPayload {
  name: string;
  slug: string;
  description: string;
  image?: string;
  vacancies_url: string;
}

export type PatchCompanyRequest = Partial<CompanyPayload>;
