import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, ExternalLink, X } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import type { Lead } from "../../types/leads";
import type { Product } from "../../types/catalog";

function ConsentIcon({ granted }: { granted: boolean }) {
  return granted ? (
    <Check className="h-4 w-4 text-emerald-600" />
  ) : (
    <X className="h-4 w-4 text-red-500" />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="text-sm text-slate-900 dark:text-white">{children}</div>
    </div>
  );
}

export function LeadDetailModal({
  isOpen,
  onClose,
  lead,
  products,
}: {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  products: Product[];
}) {
  const { t, i18n } = useTranslation();
  const locale = useLocale();

  if (!lead) return null;

  const productName = lead.product
    ? (resolve(products.find((p) => p.id === lead.product)?.name, locale) ||
      `#${lead.product}`)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("leads.leads.detailTitle")}>
      <div className="flex flex-col gap-4">
        <Field label={t("leads.leads.type")}>
          {t(`leads.leads.type_${lead.type}`, { defaultValue: lead.type })}
        </Field>
        <Field label={t("leads.leads.status")}>
          {t(`leads.leads.status_${lead.status}`, { defaultValue: lead.status })}
        </Field>
        <Field label={t("leads.leads.name")}>{lead.name}</Field>
        <Field label={t("leads.leads.email")}>{lead.email || "—"}</Field>
        <Field label={t("leads.leads.phone")}>{lead.phone || "—"}</Field>
        <Field label={t("leads.leads.message")}>
          <p className="whitespace-pre-wrap">{lead.message || "—"}</p>
        </Field>
        <Field label={t("leads.leads.product")}>{productName ?? "—"}</Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("leads.leads.consentPersonalData")}>
            <ConsentIcon granted={lead.consent_personal_data} />
          </Field>
          <Field label={t("leads.leads.consentMarketing")}>
            <ConsentIcon granted={lead.consent_marketing} />
          </Field>
        </div>

        <Field label={t("leads.leads.sourceUrl")}>
          {lead.source_url ? (
            <a
              href={lead.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="break-all">{lead.source_url}</span>
            </a>
          ) : (
            "—"
          )}
        </Field>

        <Field label={t("leads.leads.ipAddress")}>{lead.ip_address || "—"}</Field>
        <Field label={t("leads.leads.userAgent")}>
          <span className="break-all">{lead.user_agent || "—"}</span>
        </Field>
        <Field label={t("leads.leads.createdAt")}>
          {lead.created_at
            ? new Date(lead.created_at).toLocaleString(i18n.language)
            : "—"}
        </Field>
      </div>
    </Modal>
  );
}
