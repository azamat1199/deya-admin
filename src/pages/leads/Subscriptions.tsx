import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Copy } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { leadsApi } from "../../api/leads";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import type { Subscription } from "../../types/leads";

export default function Subscriptions() {
  const { t, i18n } = useTranslation();
  const { items, isLoading, hasError, remove } = useCrudList(
    leadsApi.getSubscriptions,
  );

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [deletingSubscription, setDeletingSubscription] =
    useState<Subscription | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusOptions = [
    { value: "", label: t("leads.subscriptions.allStatuses") },
    { value: "active", label: t("leads.subscriptions.active") },
    { value: "unsubscribed", label: t("leads.subscriptions.unsubscribed") },
  ];

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...items]
      .filter((s) => {
        if (statusFilter === "active") return s.is_active;
        if (statusFilter === "unsubscribed") return !s.is_active;
        return true;
      })
      .filter((s) => !q || s.email.toLowerCase().includes(q))
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [items, statusFilter, search]);

  const handleCopyEmails = async () => {
    const emails = filteredItems.filter((s) => s.is_active).map((s) => s.email);
    if (emails.length === 0) {
      toast.error(t("leads.subscriptions.copyEmailsEmpty"));
      return;
    }
    await navigator.clipboard.writeText(emails.join(", "));
    toast.success(t("leads.subscriptions.copyEmailsSuccess"));
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSubscription) return;
    setIsDeleting(true);
    try {
      await leadsApi.deleteSubscription(deletingSubscription.id);
      remove(deletingSubscription.id);
      toast.success(t("leads.subscriptions.deleteSuccess"));
      setDeletingSubscription(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Subscription>[] = [
    {
      key: "email",
      header: t("leads.subscriptions.email"),
      render: (s) => (
        <span className="text-slate-900 dark:text-white">{s.email}</span>
      ),
    },
    {
      key: "is_active",
      header: t("leads.subscriptions.status"),
      render: (s) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            s.is_active
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {t(s.is_active ? "leads.subscriptions.active" : "leads.subscriptions.unsubscribed")}
        </span>
      ),
    },
    {
      key: "created_at",
      header: t("leads.subscriptions.createdAt"),
      render: (s) =>
        s.created_at
          ? new Date(s.created_at).toLocaleString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("leads.subscriptions.title")}
        </h2>
        <Button variant="secondary" onClick={handleCopyEmails}>
          <Copy className="h-4 w-4" />
          {t("leads.subscriptions.copyEmails")}
        </Button>
      </div>

      <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <Select
          label={t("leads.subscriptions.filterStatus")}
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
        <Input
          label={t("leads.subscriptions.search")}
          placeholder={t("leads.subscriptions.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <DataTable
        columns={columns}
        items={filteredItems}
        isLoading={isLoading}
        errorMessage={hasError ? t("leads.subscriptions.loadError") : null}
        emptyMessage={t("leads.subscriptions.empty")}
        onDelete={setDeletingSubscription}
        actionsHeader={t("leads.subscriptions.actions")}
        deleteLabel={t("leads.subscriptions.delete")}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSubscription)}
        onClose={() => setDeletingSubscription(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("leads.subscriptions.confirmDeleteTitle")}
        message={t("leads.subscriptions.confirmDeleteMessage", {
          name: deletingSubscription?.email ?? "",
        })}
        confirmLabel={t("leads.subscriptions.delete")}
        cancelLabel={t("leads.subscriptions.cancel")}
      />
    </div>
  );
}
