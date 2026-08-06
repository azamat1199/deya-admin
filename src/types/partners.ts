export interface Certificate {
  id: number;
  title: string;
  image: string;
  file: string;
  created_at: string;
  updated_at: string;
}

export interface CertificatePayload {
  title: string;
  image: string;
  file: string;
}

export type PatchCertificateRequest = Partial<CertificatePayload>;

export interface Partner {
  id: number;
  name: string;
  logo: string;
  website: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerPayload {
  name: string;
  logo?: string;
  website: string;
}

export type PatchPartnerRequest = Partial<PartnerPayload>;
