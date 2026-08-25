import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { CatalogItemModal } from "./CatalogItemModal";
import { getApiErrorMessage } from "../../api/client";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import { useCrudList } from "../../hooks/useCrudList";
import type { CatalogItemBase, CatalogItemPayload } from "../../types/catalog";

export interface CatalogItemApi<T extends CatalogItemBase> {
  list: () => Promise<{ data: T[] }>;
  create: (payload: CatalogItemPayload) => Promise<{ data: T }>;
  update: (id: number, payload: CatalogItemPayload) => Promise<{ data: T }>;
  patch: (id: number, payload: Partial<CatalogItemPayload>) => Promise<{ data: T }>;
  remove: (id: number) => Promise<unknown>;
}

/** Full list+modal+delete page for a simple catalog resource (Categories,
 * Flavors, ...) — they all share the same name/slug/image/sort_order/
 * is_active shape, so `i18nNamespace` + `api` is all a page needs to say. */
export function CatalogSimpleSection<T extends CatalogItemBase>({
  i18nNamespace,
  api,
}: {
  i18nNamespace: string;
  api: CatalogItemApi<T>;
}) {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const tt = (key: string) => t(`${i18nNamespace}.${key}`);
  const { items, isLoading, hasError, upsert, replace, remove } = useCrudList(
    api.list,
  );

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sort_order - b.sort_order),
    [items],
  );

  const nextSortOrder = useMemo(
    () => (items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0),
    [items],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [deletingItem, setDeletingItem] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await api.remove(deletingItem.id);
      remove(deletingItem.id);
      toast.success(tt("deleteSuccess"));
      setDeletingItem(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item: T) => {
    const nextActive = !item.is_active;
    replace(item.id, (i) => ({ ...i, is_active: nextActive }));
    try {
      await api.patch(item.id, { is_active: nextActive });
    } catch {
      replace(item.id, (i) => ({ ...i, is_active: item.is_active }));
      toast.error(tt("statusUpdateError"));
    }
  };

  const columns: Column<T>[] = [
    {
      key: "image",
      header: tt("image"),
      render: (item) =>
        item.image ? (
          <img
            src={item.image}
            alt={resolve(item.name, locale)}
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
      header: tt("name"),
      render: (item) => (
        <span className="text-slate-900 dark:text-white">{resolve(item.name, locale)}</span>
      ),
    },
    {
      key: "slug",
      header: tt("slug"),
      render: (item) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {item.slug}
        </span>
      ),
    },
    {
      key: "sort_order",
      header: tt("sortOrder"),
      render: (item) => item.sort_order,
    },
    {
      key: "is_active",
      header: tt("status"),
      render: (item) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={item.is_active}
            onChange={() => handleToggleActive(item)}
            aria-label={tt("status")}
          />
          <span>{tt(item.is_active ? "active" : "inactive")}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: tt("createdAt"),
      render: (item) =>
        item.created_at
          ? new Date(item.created_at).toLocaleDateString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {tt("title")}
        </h2>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        >
          {tt("add")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={sortedItems}
        isLoading={isLoading}
        errorMessage={hasError ? tt("loadError") : null}
        emptyMessage={tt("empty")}
        onEdit={(item) => {
          setEditingItem(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingItem}
        actionsHeader={tt("actions")}
        editLabel={tt("edit")}
        deleteLabel={tt("delete")}
      />

      <CatalogItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        nextSortOrder={nextSortOrder}
        onSaved={upsert}
        i18nNamespace={i18nNamespace}
        create={api.create}
        update={api.update}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={tt("confirmDeleteTitle")}
        message={t(`${i18nNamespace}.confirmDeleteMessage`, {
          name: resolve(deletingItem?.name, locale),
        })}
        confirmLabel={tt("delete")}
        cancelLabel={tt("cancel")}
      />
    </div>
  );
}
