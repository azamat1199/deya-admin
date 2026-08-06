import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon, Star } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { ProductImageModal } from "./ProductImageModal";
import { catalogApi } from "../../api/catalog";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import type { ProductImage } from "../../types/catalog";

export default function ProductImages() {
  const { t } = useTranslation();
  // The backend enforces "only one main image per product", so mutations
  // always refetch instead of merging responses in locally — that's the
  // only way to keep every row's is_main truthful after a PATCH/POST.
  const { items, isLoading, hasError, refetch } = useCrudList(
    catalogApi.getProductImages,
  );
  const productsList = useCrudList(catalogApi.getProducts);

  const productNames = useMemo(
    () => new Map(productsList.items.map((p) => [p.id, p.name])),
    [productsList.items],
  );

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => a.product - b.product || a.sort_order - b.sort_order,
      ),
    [items],
  );

  const nextSortOrder = useMemo(
    () => (items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0),
    [items],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [deletingImage, setDeletingImage] = useState<ProductImage | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingImage) return;
    setIsDeleting(true);
    try {
      await catalogApi.deleteProductImage(deletingImage.id);
      toast.success(t("catalog.productImages.deleteSuccess"));
      setDeletingImage(null);
      refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleMain = async (image: ProductImage) => {
    try {
      await catalogApi.patchProductImage(image.id, { is_main: !image.is_main });
      refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const columns: Column<ProductImage>[] = [
    {
      key: "image",
      header: t("catalog.productImages.image"),
      render: (img) =>
        img.image ? (
          <img
            src={img.image}
            alt={img.alt}
            className="h-10 w-16 rounded object-cover"
          />
        ) : (
          <span className="flex h-10 w-16 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
            <ImageIcon className="h-4 w-4 text-slate-400" />
          </span>
        ),
    },
    {
      key: "product",
      header: t("catalog.productImages.product"),
      render: (img) => productNames.get(img.product) ?? `#${img.product}`,
    },
    {
      key: "alt",
      header: t("catalog.productImages.alt"),
      render: (img) => (
        <span className="line-clamp-1 max-w-xs">{img.alt || "—"}</span>
      ),
    },
    {
      key: "is_main",
      header: t("catalog.productImages.isMain"),
      render: (img) => (
        <button
          type="button"
          onClick={() => handleToggleMain(img)}
          aria-label={t("catalog.productImages.isMain")}
          aria-pressed={img.is_main}
          className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Star
            className={`h-4 w-4 ${
              img.is_main
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300 dark:text-slate-600"
            }`}
          />
        </button>
      ),
    },
    {
      key: "sort_order",
      header: t("catalog.productImages.sortOrder"),
      render: (img) => img.sort_order,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("catalog.productImages.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingImage(null);
            setIsModalOpen(true);
          }}
        >
          {t("catalog.productImages.add")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={sortedItems}
        isLoading={isLoading || productsList.isLoading}
        errorMessage={
          hasError || productsList.hasError
            ? t("catalog.productImages.loadError")
            : null
        }
        emptyMessage={t("catalog.productImages.empty")}
        onEdit={(image) => {
          setEditingImage(image);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingImage}
        actionsHeader={t("catalog.productImages.actions")}
        editLabel={t("catalog.productImages.edit")}
        deleteLabel={t("catalog.productImages.delete")}
      />

      <ProductImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productImage={editingImage}
        nextSortOrder={nextSortOrder}
        onSaved={refetch}
        products={productsList.items}
        isLoadingProducts={productsList.isLoading}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingImage)}
        onClose={() => setDeletingImage(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("catalog.productImages.confirmDeleteTitle")}
        message={t("catalog.productImages.confirmDeleteMessage", {
          name: deletingImage ? `#${deletingImage.id}` : "",
        })}
        confirmLabel={t("catalog.productImages.delete")}
        cancelLabel={t("catalog.productImages.cancel")}
      />
    </div>
  );
}
