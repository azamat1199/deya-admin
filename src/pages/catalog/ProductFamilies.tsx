import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { ProductFamilyModal } from "./ProductFamilyModal";
import { catalogApi } from "../../api/catalog";
import { getApiErrorMessage } from "../../api/client";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import { useCrudList } from "../../hooks/useCrudList";
import type { ProductFamily } from "../../types/catalog";

export default function ProductFamilies() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    catalogApi.getProductFamilies,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<ProductFamily | null>(
    null,
  );
  const [deletingFamily, setDeletingFamily] = useState<ProductFamily | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingFamily) return;
    setIsDeleting(true);
    try {
      await catalogApi.deleteProductFamily(deletingFamily.id);
      remove(deletingFamily.id);
      toast.success(t("catalog.productFamilies.deleteSuccess"));
      setDeletingFamily(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<ProductFamily>[] = [
    {
      key: "name",
      header: t("catalog.productFamilies.name"),
      render: (f) => (
        <span className="text-slate-900 dark:text-white">{resolve(f.name, locale)}</span>
      ),
    },
    {
      key: "slug",
      header: t("catalog.productFamilies.slug"),
      render: (f) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {f.slug}
        </span>
      ),
    },
    {
      key: "created_at",
      header: t("catalog.productFamilies.createdAt"),
      render: (f) =>
        f.created_at
          ? new Date(f.created_at).toLocaleDateString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("catalog.productFamilies.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingFamily(null);
            setIsModalOpen(true);
          }}
        >
          {t("catalog.productFamilies.add")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("catalog.productFamilies.loadError") : null}
        emptyMessage={t("catalog.productFamilies.empty")}
        onEdit={(family) => {
          setEditingFamily(family);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingFamily}
        actionsHeader={t("catalog.productFamilies.actions")}
        editLabel={t("catalog.productFamilies.edit")}
        deleteLabel={t("catalog.productFamilies.delete")}
      />

      <ProductFamilyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productFamily={editingFamily}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingFamily)}
        onClose={() => setDeletingFamily(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("catalog.productFamilies.confirmDeleteTitle")}
        message={t("catalog.productFamilies.confirmDeleteMessage", {
          name: resolve(deletingFamily?.name, locale),
        })}
        confirmLabel={t("catalog.productFamilies.delete")}
        cancelLabel={t("catalog.productFamilies.cancel")}
      />
    </div>
  );
}
