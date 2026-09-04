import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { ProductInfoModal } from "./ProductInfoModal";
// Lives under Careers in the UI, but the backend has no /careers/ endpoint
// for it — this reads/writes /api/v1/admin/about/product-info/, unchanged.
import { aboutApi } from "../../api/about";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import type { ProductInfo as ProductInfoItem } from "../../types/about";

/** title/description are TipTap HTML now, not plain text — a table cell
 * renders this as JSX text, so without stripping tags the row would show
 * literal "<p>...</p>" characters instead of a plain preview. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function ProductInfo() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    aboutApi.getProductInfos,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductInfoItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ProductInfoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await aboutApi.deleteProductInfo(deletingItem.id);
      remove(deletingItem.id);
      toast.success(t("careers.productInfo.deleteSuccess"));
      setDeletingItem(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<ProductInfoItem>[] = [
    {
      key: "image",
      header: t("careers.productInfo.image"),
      render: (i) =>
        i.image ? (
          <img
            src={i.image}
            alt={stripHtml(resolve(i.title, locale))}
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
      header: t("careers.productInfo.itemTitle"),
      render: (i) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {stripHtml(resolve(i.title, locale))}
        </span>
      ),
    },
    {
      key: "description",
      header: t("careers.productInfo.description"),
      render: (i) => (
        <span className="line-clamp-1 max-w-xs">
          {stripHtml(resolve(i.description, locale))}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("careers.productInfo.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        >
          {t("careers.productInfo.addItem")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("careers.productInfo.loadError") : null}
        emptyMessage={t("careers.productInfo.empty")}
        onEdit={(item) => {
          setEditingItem(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingItem}
        actionsHeader={t("careers.productInfo.actions")}
        editLabel={t("careers.productInfo.editItem")}
        deleteLabel={t("careers.productInfo.delete")}
      />

      <ProductInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("careers.productInfo.confirmDeleteTitle")}
        message={t("careers.productInfo.confirmDeleteMessage", {
          name: deletingItem ? stripHtml(resolve(deletingItem.title, locale)) : "",
        })}
        confirmLabel={t("careers.productInfo.delete")}
        cancelLabel={t("careers.productInfo.cancel")}
      />
    </div>
  );
}
