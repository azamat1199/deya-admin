import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { LeadDetailModal } from "./LeadDetailModal";
import { leadsApi } from "../../api/leads";
import { catalogApi } from "../../api/catalog";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import { LEAD_TYPES, LEAD_STATUSES } from "../../types/leads";
import type { Lead } from "../../types/leads";

const TYPE_COLORS: Record<string, string> = {
  partner: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  contact: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  order: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function chipClass(map: Record<string, string>, value: string) {
  return (
    map[value] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  );
}

export default function Leads() {
  const { t, i18n } = useTranslation();
  const { items, isLoading, hasError, replace, remove } = useCrudList(
    leadsApi.getLeads,
  );
  const productsList = useCrudList(catalogApi.getProducts);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusOptions = useMemo(() => {
    const values = new Set<string>(LEAD_STATUSES);
    items.forEach((l) => values.add(l.status));
    return [
      { value: "", label: t("leads.leads.allStatuses") },
      ...Array.from(values).map((value) => ({
        value,
        label: t(`leads.leads.status_${value}`, { defaultValue: value }),
      })),
    ];
  }, [items, t]);

  const typeOptions = useMemo(() => {
    const values = new Set<string>(LEAD_TYPES);
    items.forEach((l) => values.add(l.type));
    return [
      { value: "", label: t("leads.leads.allTypes") },
      ...Array.from(values).map((value) => ({
        value,
        label: t(`leads.leads.type_${value}`, { defaultValue: value }),
      })),
    ];
  }, [items, t]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...items]
      .filter((l) => !statusFilter || l.status === statusFilter)
      .filter((l) => !typeFilter || l.type === typeFilter)
      .filter(
        (l) =>
          !q ||
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q),
      )
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [items, statusFilter, typeFilter, search]);

  const handleDeleteConfirm = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    try {
      await leadsApi.deleteLead(deletingLead.id);
      remove(deletingLead.id);
      toast.success(t("leads.leads.deleteSuccess"));
      setDeletingLead(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (lead: Lead, nextStatus: string) => {
    const previousStatus = lead.status;
    replace(lead.id, (l) => ({ ...l, status: nextStatus }));
    try {
      await leadsApi.updateLeadStatus(lead.id, nextStatus);
      toast.success(t("leads.leads.statusUpdateSuccess"));
    } catch (error) {
      replace(lead.id, (l) => ({ ...l, status: previousStatus }));
      toast.error(getApiErrorMessage(error));
    }
  };

  const columns: Column<Lead>[] = [
    {
      key: "created_at",
      header: t("leads.leads.createdAt"),
      render: (l) =>
        l.created_at
          ? new Date(l.created_at).toLocaleString(i18n.language)
          : "—",
    },
    {
      key: "type",
      header: t("leads.leads.type"),
      render: (l) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${chipClass(TYPE_COLORS, l.type)}`}
        >
          {t(`leads.leads.type_${l.type}`, { defaultValue: l.type })}
        </span>
      ),
    },
    {
      key: "name",
      header: t("leads.leads.name"),
      render: (l) => (
        <span className="flex items-center gap-2">
          {l.status === "new" && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          )}
          <span
            className={
              l.status === "new"
                ? "font-semibold text-slate-900 dark:text-white"
                : "text-slate-900 dark:text-white"
            }
          >
            {l.name}
          </span>
        </span>
      ),
    },
    {
      key: "email",
      header: t("leads.leads.email"),
      render: (l) => l.email || "—",
    },
    {
      key: "phone",
      header: t("leads.leads.phone"),
      render: (l) => l.phone || "—",
    },
    {
      key: "status",
      header: t("leads.leads.status"),
      render: (l) => (
        <select
          value={l.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleStatusChange(l, e.target.value)}
          className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 ${chipClass(STATUS_COLORS, l.status)}`}
        >
          {statusOptions
            .filter((opt) => opt.value)
            .map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>
      ),
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        {t("leads.leads.title")}
      </h2>

      <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <Select
          label={t("leads.leads.filterStatus")}
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
        <Select
          label={t("leads.leads.filterType")}
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
        <Input
          label={t("leads.leads.search")}
          placeholder={t("leads.leads.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <DataTable
        columns={columns}
        items={filteredItems}
        isLoading={isLoading || productsList.isLoading}
        errorMessage={hasError ? t("leads.leads.loadError") : null}
        emptyMessage={t("leads.leads.empty")}
        onRowClick={setViewingLead}
        onView={setViewingLead}
        onDelete={setDeletingLead}
        actionsHeader={t("leads.leads.actions")}
        viewLabel={t("leads.leads.view")}
        deleteLabel={t("leads.leads.delete")}
      />

      <LeadDetailModal
        isOpen={Boolean(viewingLead)}
        onClose={() => setViewingLead(null)}
        lead={viewingLead}
        products={productsList.items}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingLead)}
        onClose={() => setDeletingLead(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("leads.leads.confirmDeleteTitle")}
        message={t("leads.leads.confirmDeleteMessage", {
          name: deletingLead?.name ?? "",
        })}
        confirmLabel={t("leads.leads.delete")}
        cancelLabel={t("leads.leads.cancel")}
      />
    </div>
  );
}
