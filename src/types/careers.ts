export interface CareerValue {
  id: number;
  title: string;
  text: string;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface CareerValuePayload {
  title: string;
  text: string;
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
