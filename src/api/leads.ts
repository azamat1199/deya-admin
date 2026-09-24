import { apiClient } from "./client";
import type { PageParams } from "./pagination";
import type { Paginated } from "./i18n";
import type { Lead, Subscription } from "../types/leads";

const LEADS_URL = "/api/v1/admin/leads/leads/";
const SUBSCRIPTIONS_URL = "/api/v1/admin/leads/subscriptions/";

export const leadsApi = {
  getLeads: (params?: PageParams) =>
    apiClient.get<Lead[] | Paginated<Lead>>(LEADS_URL, { params }),

  getLead: (id: number) => apiClient.get<Lead>(`${LEADS_URL}${id}/`),

  deleteLead: (id: number) => apiClient.delete<void>(`${LEADS_URL}${id}/`),

  // Leads are never created or edited from the admin — the only write is
  // the status transition, via its own /status/ sub-endpoint.
  updateLeadStatus: (id: number, status: string) =>
    apiClient.patch<Lead>(`${LEADS_URL}${id}/status/`, { status }),

  // Subscriptions are read + delete only — visitors create them from the
  // public site, there is no admin create/update endpoint.
  getSubscriptions: () => apiClient.get<Subscription[]>(SUBSCRIPTIONS_URL),

  getSubscription: (id: number) =>
    apiClient.get<Subscription>(`${SUBSCRIPTIONS_URL}${id}/`),

  deleteSubscription: (id: number) =>
    apiClient.delete<void>(`${SUBSCRIPTIONS_URL}${id}/`),
};
