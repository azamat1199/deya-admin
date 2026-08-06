import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon, ExternalLink } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { PartnerModal } from "./PartnerModal";
import { partnersApi } from "../../api/partners";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import type { Partner } from "../../types/partners";

export default function PartnersList() {
  const { t, i18n } = useTranslation();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    partnersApi.getPartners,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingPartner) return;
    setIsDeleting(true);
    try {
      await partnersApi.deletePartner(deletingPartner.id);
      remove(deletingPartner.id);
      toast.success(t("partners.partners.deleteSuccess"));
      setDeletingPartner(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Partner>[] = [
    {
      key: "logo",
      header: t("partners.partners.logo"),
      render: (p) =>
        p.logo ? (
          <img
            src={p.logo}
            alt={p.name}
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
      header: t("partners.partners.name"),
      render: (p) => (
        <span className="text-slate-900 dark:text-white">{p.name}</span>
      ),
    },
    {
      key: "website",
      header: t("partners.partners.website"),
      render: (p) =>
        p.website ? (
          <a
            href={p.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-[12rem] items-center gap-1 truncate text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{p.website}</span>
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "created_at",
      header: t("partners.partners.createdAt"),
      render: (p) =>
        p.created_at
          ? new Date(p.created_at).toLocaleDateString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("partners.partners.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingPartner(null);
            setIsModalOpen(true);
          }}
        >
          {t("partners.partners.add")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("partners.partners.loadError") : null}
        emptyMessage={t("partners.partners.empty")}
        onEdit={(partner) => {
          setEditingPartner(partner);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingPartner}
        actionsHeader={t("partners.partners.actions")}
        editLabel={t("partners.partners.edit")}
        deleteLabel={t("partners.partners.delete")}
      />

      <PartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partner={editingPartner}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingPartner)}
        onClose={() => setDeletingPartner(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("partners.partners.confirmDeleteTitle")}
        message={t("partners.partners.confirmDeleteMessage", {
          name: deletingPartner?.name ?? "",
        })}
        confirmLabel={t("partners.partners.delete")}
        cancelLabel={t("partners.partners.cancel")}
      />
    </div>
  );
}
