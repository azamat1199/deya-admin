import type { Translatable, TranslatableInput } from "../api/i18n";

export interface Certificate {
  id: number;
  title: Translatable | string;
  image: string;
  file: string;
  created_at: string;
  updated_at: string;
}

export interface CertificatePayload {
  title: TranslatableInput;
  image: string;
  file: string;
}

export type PatchCertificateRequest = Partial<CertificatePayload>;

export interface Partner {
  id: number;
  // Plain string, NOT translatable: partner names are the same in every
  // language. Wrapping this is what "Not a valid string." would report.
  name: string;
  logo: string;
  website: string;
  created_at: string;
  updated_at: string;
}

/** Create payload. `logo` is required by the schema — a partner cannot be
 * created without one. */
export interface PartnerPayload {
  name: string;
  logo: string;
  website: string;
}

/**
 * Edit payload. `logo` is optional here on purpose: omit it to leave the
 * stored logo untouched, or send an explicit null to remove it. Never
 * re-send the loaded URL unconditionally — that's the CompanyModal bug this
 * type exists to prevent from recurring.
 */
export type PatchPartnerRequest = Partial<Omit<PartnerPayload, "logo">> & {
  logo?: string | null;
};
