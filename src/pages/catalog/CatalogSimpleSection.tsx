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
import type { CatalogListItem, CatalogWritePayloadBase } from "../../types/catalog";

export interface CatalogItemApi<
  T extends CatalogListItem,
  P extends CatalogWritePayloadBase,
> {
  list: () => Promise<{ data: T[] }>;
  create: (payload: P) => Promise<{ data: T }>;
  update: (id: number, payload: P) => Promise<{ data: T }>;
  patch: (id: number, payload: Partial<P>) => Promise<{ data: T }>;
  remove: (id: number) => Promise<unknown>;
}

/** Fields present on `T` only for resources that have them — see the same
 * type in CatalogItemModal.tsx. */
interface OptionalCatalogFields {
  image?: string;
  is_active?: boolean;
  created_at?: string;
}

/** Full list+modal+delete page for a simple catalog resource (Categories,
 * Flavors, ...). `hasImage`/`hasIsActive` say which of the two
 * resource-specific columns/fields this instance actually has —
 * Categories passes both true, Flavors both false. */
export function CatalogSimpleSection<
  T extends CatalogListItem,
  P extends CatalogWritePayloadBase,
>({
  i18nNamespace,
  localeKey,
  hasImage,
  hasIsActive,
  api,
}: {
  i18nNamespace: string;
  localeKey: string;
  hasImage: boolean;
  hasIsActive: boolean;
  api: CatalogItemApi<T, P>;
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

  // Only reachable when hasIsActive is true — the column that calls this is
  // itself gated on the same flag. The cast bridges `P` (whichever payload
  // type the caller passed) to the fact that this resource has `is_active`,
  // a correlation the shared generic can't express statically (see
  // CatalogItemModal's onSubmit for the same pattern).
  const handleToggleActive = async (item: T & OptionalCatalogFields) => {
    const nextActive = !item.is_active;
    replace(item.id, (i) => ({ ...i, is_active: nextActive }));
    try {
      await api.patch(item.id, { is_active: nextActive } as unknown as Partial<P>);
    } catch {
      replace(item.id, (i) => ({ ...i, is_active: item.is_active }));
      toast.error(tt("statusUpdateError"));
    }
  };

  const columns: Column<T>[] = [
    ...(hasImage
      ? [
          {
            key: "image",
            header: tt("image"),
            render: (item: T) => {
              const image = (item as T & OptionalCatalogFields).image;
              return image ? (
                <img
                  src={image}
                  alt={resolve(item.name, locale)}
                  className="h-10 w-16 rounded object-cover"
                />
              ) : (
                <span className="flex h-10 w-16 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                </span>
              );
            },
          } satisfies Column<T>,
        ]
      : []),
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
    ...(hasIsActive
      ? [
          {
            key: "is_active",
            header: tt("status"),
            render: (item: T) => {
              const activeItem = item as T & OptionalCatalogFields;
              return (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={activeItem.is_active ?? false}
                    onChange={() => handleToggleActive(activeItem)}
                    aria-label={tt("status")}
                  />
                  <span>{tt(activeItem.is_active ? "active" : "inactive")}</span>
                </div>
              );
            },
          } satisfies Column<T>,
        ]
      : []),
    {
      key: "created_at",
      header: tt("createdAt"),
      render: (item) => {
        const createdAt = (item as T & OptionalCatalogFields).created_at;
        return createdAt ? new Date(createdAt).toLocaleDateString(i18n.language) : "—";
      },
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
        localeKey={localeKey}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        nextSortOrder={nextSortOrder}
        onSaved={upsert}
        i18nNamespace={i18nNamespace}
        hasImage={hasImage}
        hasIsActive={hasIsActive}
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
