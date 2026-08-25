import { apiClient } from "./client";
import type { Paginated } from "./i18n";
import type {
  CareerValue,
  CareerValuePayload,
  PatchCareerValueRequest,
  Company,
  CompanyPayload,
  PatchCompanyRequest,
} from "../types/careers";

const CAREER_VALUES_URL = "/api/v1/admin/careers/career-values/";
const COMPANIES_URL = "/api/v1/admin/careers/companies/";

export interface CareerValueListParams {
  page?: number;
  search?: string;
  ordering?: string;
}

export const careersApi = {
  // Typed as either shape: this list is documented as paginated, but sibling
  // endpoints on this API return bare arrays. useCrudList normalizes both.
  getCareerValues: (params?: CareerValueListParams) =>
    apiClient.get<CareerValue[] | Paginated<CareerValue>>(CAREER_VALUES_URL, {
      params,
    }),

  getCareerValue: (id: number) =>
    apiClient.get<CareerValue>(`${CAREER_VALUES_URL}${id}/`),

  createCareerValue: (data: CareerValuePayload) =>
    apiClient.post<CareerValue>(CAREER_VALUES_URL, data),

  updateCareerValue: (id: number, data: CareerValuePayload) =>
    apiClient.put<CareerValue>(`${CAREER_VALUES_URL}${id}/`, data),

  patchCareerValue: (id: number, data: PatchCareerValueRequest) =>
    apiClient.patch<CareerValue>(`${CAREER_VALUES_URL}${id}/`, data),

  deleteCareerValue: (id: number) =>
    apiClient.delete<void>(`${CAREER_VALUES_URL}${id}/`),

  getCompanies: () => apiClient.get<Company[]>(COMPANIES_URL),

  getCompany: (id: number) => apiClient.get<Company>(`${COMPANIES_URL}${id}/`),

  createCompany: (data: CompanyPayload) =>
    apiClient.post<Company>(COMPANIES_URL, data),

  updateCompany: (id: number, data: CompanyPayload) =>
    apiClient.put<Company>(`${COMPANIES_URL}${id}/`, data),

  patchCompany: (id: number, data: PatchCompanyRequest) =>
    apiClient.patch<Company>(`${COMPANIES_URL}${id}/`, data),

  deleteCompany: (id: number) =>
    apiClient.delete<void>(`${COMPANIES_URL}${id}/`),
};
