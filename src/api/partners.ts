import { apiClient } from "./client";
import type {
  Certificate,
  CertificatePayload,
  PatchCertificateRequest,
  Partner,
  PartnerPayload,
  PatchPartnerRequest,
} from "../types/partners";

const CERTIFICATES_URL = "/api/v1/admin/partners/certificates/";
const PARTNERS_URL = "/api/v1/admin/partners/partners/";

export const partnersApi = {
  getCertificates: () => apiClient.get<Certificate[]>(CERTIFICATES_URL),

  getCertificate: (id: number) =>
    apiClient.get<Certificate>(`${CERTIFICATES_URL}${id}/`),

  createCertificate: (data: CertificatePayload) =>
    apiClient.post<Certificate>(CERTIFICATES_URL, data),

  updateCertificate: (id: number, data: CertificatePayload) =>
    apiClient.put<Certificate>(`${CERTIFICATES_URL}${id}/`, data),

  patchCertificate: (id: number, data: PatchCertificateRequest) =>
    apiClient.patch<Certificate>(`${CERTIFICATES_URL}${id}/`, data),

  deleteCertificate: (id: number) =>
    apiClient.delete<void>(`${CERTIFICATES_URL}${id}/`),

  getPartners: () => apiClient.get<Partner[]>(PARTNERS_URL),

  getPartner: (id: number) => apiClient.get<Partner>(`${PARTNERS_URL}${id}/`),

  createPartner: (data: PartnerPayload) =>
    apiClient.post<Partner>(PARTNERS_URL, data),

  updatePartner: (id: number, data: PartnerPayload) =>
    apiClient.put<Partner>(`${PARTNERS_URL}${id}/`, data),

  patchPartner: (id: number, data: PatchPartnerRequest) =>
    apiClient.patch<Partner>(`${PARTNERS_URL}${id}/`, data),

  deletePartner: (id: number) => apiClient.delete<void>(`${PARTNERS_URL}${id}/`),
};
