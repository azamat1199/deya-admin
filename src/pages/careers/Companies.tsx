import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon, ExternalLink } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { CompanyModal } from "./CompanyModal";
import { careersApi } from "../../api/careers";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import type { Company } from "../../types/careers";

export default function Companies() {
  const { t, i18n } = useTranslation();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    careersApi.getCompanies,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;
    setIsDeleting(true);
    try {
      await careersApi.deleteCompany(deletingCompany.id);
      remove(deletingCompany.id);
      toast.success(t("careers.companies.deleteSuccess"));
      setDeletingCompany(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Company>[] = [
    {
      key: "image",
      header: t("careers.companies.logo"),
      render: (c) =>
        c.image ? (
          <img
            src={c.image}
            alt={c.name}
            className="h-10 w-16 rounded object-cover"
          />
        ) : (
          <span className="flex h-10 w-16 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
            <ImageIcon className="h-4 w-4 text-slate-400" />
          </span>
        ),
    },
    {
      key: "name",
      header: t("careers.companies.name"),
      render: (c) => (
        <span className="text-slate-900 dark:text-white">{c.name}</span>
      ),
    },
    {
      key: "slug",
      header: t("careers.companies.slug"),
      render: (c) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {c.slug}
        </span>
      ),
    },
    {
      key: "vacancies_url",
      header: t("careers.companies.vacanciesUrl"),
      render: (c) =>
        c.vacancies_url ? (
          <a
            href={c.vacancies_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-[12rem] items-center gap-1 truncate text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{c.vacancies_url}</span>
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "created_at",
      header: t("careers.companies.createdAt"),
      render: (c) =>
        c.created_at
          ? new Date(c.created_at).toLocaleDateString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("careers.companies.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingCompany(null);
            setIsModalOpen(true);
          }}
        >
          {t("careers.companies.addCompany")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("careers.companies.loadError") : null}
        emptyMessage={t("careers.companies.empty")}
        onEdit={(company) => {
          setEditingCompany(company);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingCompany}
        actionsHeader={t("careers.companies.actions")}
        editLabel={t("careers.companies.editCompany")}
        deleteLabel={t("careers.companies.delete")}
      />

      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={editingCompany}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingCompany)}
        onClose={() => setDeletingCompany(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("careers.companies.confirmDeleteTitle")}
        message={t("careers.companies.confirmDeleteMessage", {
          name: deletingCompany?.name ?? "",
        })}
        confirmLabel={t("careers.companies.delete")}
        cancelLabel={t("careers.companies.cancel")}
      />
    </div>
  );
}
