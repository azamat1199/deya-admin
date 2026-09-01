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
  name: Translatable | string;
  logo: string;
  website: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerPayload {
  name: TranslatableInput;
  logo?: string;
  website: string;
}

export type PatchPartnerRequest = Partial<PartnerPayload>;
