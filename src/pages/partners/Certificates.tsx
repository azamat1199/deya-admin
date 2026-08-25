import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon, Download } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { CertificateModal } from "./CertificateModal";
import { partnersApi } from "../../api/partners";
import { getApiErrorMessage } from "../../api/client";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import { useCrudList } from "../../hooks/useCrudList";
import type { Certificate } from "../../types/partners";

export default function Certificates() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    partnersApi.getCertificates,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(
    null,
  );
  const [deletingCertificate, setDeletingCertificate] =
    useState<Certificate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingCertificate) return;
    setIsDeleting(true);
    try {
      await partnersApi.deleteCertificate(deletingCertificate.id);
      remove(deletingCertificate.id);
      toast.success(t("partners.certificates.deleteSuccess"));
      setDeletingCertificate(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Certificate>[] = [
    {
      key: "image",
      header: t("partners.certificates.image"),
      render: (c) =>
        c.image ? (
          <img
            src={c.image}
            alt={resolve(c.title, locale)}
            className="h-10 w-16 rounded object-cover"
          />
        ) : (
          <span className="flex h-10 w-16 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
            <ImageIcon className="h-4 w-4 text-slate-400" />
          </span>
        ),
    },
    {
      key: "title",
      header: t("partners.certificates.certTitle"),
      render: (c) => (
        <span className="line-clamp-1 max-w-xs text-slate-900 dark:text-white">
          {resolve(c.title, locale)}
        </span>
      ),
    },
    {
      key: "file",
      header: t("partners.certificates.file"),
      render: (c) =>
        c.file ? (
          <a
            href={c.file}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            aria-label={t("partners.certificates.openFile")}
          >
            <Download className="h-4 w-4" />
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "created_at",
      header: t("partners.certificates.createdAt"),
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
          {t("partners.certificates.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingCertificate(null);
            setIsModalOpen(true);
          }}
        >
          {t("partners.certificates.add")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("partners.certificates.loadError") : null}
        emptyMessage={t("partners.certificates.empty")}
        onEdit={(certificate) => {
          setEditingCertificate(certificate);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingCertificate}
        actionsHeader={t("partners.certificates.actions")}
        editLabel={t("partners.certificates.edit")}
        deleteLabel={t("partners.certificates.delete")}
      />

      <CertificateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certificate={editingCertificate}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingCertificate)}
        onClose={() => setDeletingCertificate(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("partners.certificates.confirmDeleteTitle")}
        message={t("partners.certificates.confirmDeleteMessage", {
          name: resolve(deletingCertificate?.title, locale),
        })}
        confirmLabel={t("partners.certificates.delete")}
        cancelLabel={t("partners.certificates.cancel")}
      />
    </div>
  );
}
