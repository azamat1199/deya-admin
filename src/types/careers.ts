import type { Translatable, TranslatableInput } from "../api/i18n";

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
  title: TranslatableInput;
  text: TranslatableInput;
  image?: string;
}

export type PatchCareerValueRequest = Partial<CareerValuePayload>;

// Confirmed via a live GET (/api/v1/companies/, the public mirror): the
// resource returns exactly {id, name, slug, description, image,
// vacancies_url} — no created_at/updated_at. The schema agrees
// (CompanyAdminRequest/Company have no timestamp fields).
export interface Company {
  id: number;
  // Plain string, NOT translatable: this model mixes field types and only
  // `description` is a locale dict. Sending an object here returns
  // {"name": ["Not a valid string."]}.
  name: string;
  slug: string;
  description: Translatable | string;
  image: string;
  vacancies_url: string;
}

/** Create payload. `image` is required by the schema — a company cannot be
 * created without one. */
export interface CompanyPayload {
  name: string;
  slug: string;
  description: TranslatableInput;
  image: string;
  vacancies_url: string;
}

/**
 * Edit payload. `image` is optional here on purpose: omit it to leave the
 * stored image untouched, or send an explicit null to remove it. Never
 * re-send the loaded display URL unconditionally.
 */
export type PatchCompanyRequest = Partial<Omit<CompanyPayload, "image">> & {
  image?: string | null;
};
