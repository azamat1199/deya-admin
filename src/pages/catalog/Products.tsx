import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { catalogApi } from "../../api/catalog";
import {
  BADGE_CHIP_CLASS,
  badgeLabelKey,
} from "../../constants/productBadge";
import { getApiErrorMessage } from "../../api/client";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import { useCrudList } from "../../hooks/useCrudList";
import type { Product } from "../../types/catalog";

function badgeChipClass(badge: string) {
  return (
    BADGE_CHIP_CLASS[badge as keyof typeof BADGE_CHIP_CLASS] ??
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  );
}

export default function Products() {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const { items, isLoading, hasError, replace, remove } = useCrudList(
    catalogApi.getProducts,
  );
  const categoriesList = useCrudList(catalogApi.getCategories);
  const familiesList = useCrudList(catalogApi.getProductFamilies);
  const flavorsList = useCrudList(catalogApi.getFlavors);

  const categoryNames = useMemo(
    () => new Map(categoriesList.items.map((c) => [c.id, resolve(c.name, locale)])),
    [categoriesList.items, locale],
  );
  const familyNames = useMemo(
    () => new Map(familiesList.items.map((f) => [f.id, resolve(f.name, locale)])),
    [familiesList.items, locale],
  );
  const flavorNames = useMemo(
    () => new Map(flavorsList.items.map((f) => [f.id, resolve(f.name, locale)])),
    [flavorsList.items, locale],
  );

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sort_order - b.sort_order),
    [items],
  );

  const isLoadingAny =
    isLoading ||
    categoriesList.isLoading ||
    familiesList.isLoading ||
    flavorsList.isLoading;
  const hasAnyError =
    hasError || categoriesList.hasError || familiesList.hasError || flavorsList.hasError;

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await catalogApi.deleteProduct(deletingProduct.id);
      remove(deletingProduct.id);
      toast.success(t("catalog.products.deleteSuccess"));
      setDeletingProduct(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    const nextActive = !product.is_active;
    replace(product.id, (p) => ({ ...p, is_active: nextActive }));
    try {
      await catalogApi.patchProduct(product.id, { is_active: nextActive });
    } catch {
      replace(product.id, (p) => ({ ...p, is_active: product.is_active }));
      toast.error(t("catalog.products.statusUpdateError"));
    }
  };

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: t("catalog.products.name"),
      render: (p) => (
        <span className="line-clamp-1 max-w-xs text-slate-900 dark:text-white">
          {resolve(p.name, locale)}
        </span>
      ),
    },
    {
      key: "code",
      header: t("catalog.products.code"),
      render: (p) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {p.code || "—"}
        </span>
      ),
    },
    {
      key: "category",
      header: t("catalog.products.category"),
      render: (p) => categoryNames.get(p.category) ?? `#${p.category}`,
    },
    {
      key: "family",
      header: t("catalog.products.family"),
      render: (p) => familyNames.get(p.family) ?? `#${p.family}`,
    },
    {
      key: "flavor",
      header: t("catalog.products.flavor"),
      render: (p) => flavorNames.get(p.flavor) ?? `#${p.flavor}`,
    },
    {
      key: "badge",
      header: t("catalog.products.badge"),
      render: (p) =>
        p.badge ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeChipClass(p.badge)}`}
          >
            {t(badgeLabelKey(p.badge))}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "is_featured",
      header: t("catalog.products.isFeatured"),
      render: (p) => (
        <Sparkles
          className={`h-4 w-4 ${
            p.is_featured ? "text-amber-500" : "text-slate-300 dark:text-slate-600"
          }`}
        />
      ),
    },
    {
      key: "is_active",
      header: t("catalog.products.status"),
      render: (p) => (
        <Switch
          checked={p.is_active}
          onChange={() => handleToggleActive(p)}
          aria-label={t("catalog.products.status")}
        />
      ),
    },
    {
      key: "sort_order",
      header: t("catalog.products.sortOrder"),
      render: (p) => p.sort_order,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("catalog.products.title")}
        </h2>
        <Button onClick={() => navigate("/catalog/products/create")}>
          {t("catalog.products.add")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={sortedItems}
        isLoading={isLoadingAny}
        errorMessage={hasAnyError ? t("catalog.products.loadError") : null}
        emptyMessage={t("catalog.products.empty")}
        onEdit={(product) => navigate(`/catalog/products/${product.id}/edit`)}
        onDelete={setDeletingProduct}
        actionsHeader={t("catalog.products.actions")}
        editLabel={t("catalog.products.edit")}
        deleteLabel={t("catalog.products.delete")}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("catalog.products.confirmDeleteTitle")}
        message={t("catalog.products.confirmDeleteMessage", {
          name: resolve(deletingProduct?.name, locale),
        })}
        confirmLabel={t("catalog.products.delete")}
        cancelLabel={t("catalog.products.cancel")}
      />
    </div>
  );
}
