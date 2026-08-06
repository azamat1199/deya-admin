// Guessed from the prompt's one confirmed example ("partner") — the
// backend's Swagger schema was behind auth we couldn't reach to confirm
// the rest. Unmapped/unknown type strings still round-trip fine (Lead.type
// is a plain string, not this union) — verify against Swagger and adjust
// once confirmed.
export type LeadType = "partner" | "contact" | "order";
export const LEAD_TYPES: LeadType[] = ["partner", "contact", "order"];

// Same caveat as LeadType — only "new" is confirmed by the prompt.
export type LeadStatus = "new" | "in_progress" | "done" | "rejected";
export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "in_progress",
  "done",
  "rejected",
];

export interface Lead {
  id: number;
  type: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  product: number | null;
  consent_personal_data: boolean;
  consent_marketing: boolean;
  status: string;
  source_url: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface Subscription {
  id: number;
  email: string;
  is_active: boolean;
  unsubscribe_token: string;
  created_at: string;
}
