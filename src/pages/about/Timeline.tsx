import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { TimelineModal } from "./TimelineModal";
import { aboutApi } from "../../api/about";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import type { TimelineItem } from "../../types/about";

export default function Timeline() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    aboutApi.getTimeline,
  );

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.year - b.year),
    [items],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<TimelineItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await aboutApi.deleteTimelineItem(deletingItem.id);
      remove(deletingItem.id);
      toast.success(t("about.timeline.deleteSuccess"));
      setDeletingItem(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<TimelineItem>[] = [
    {
      key: "image",
      header: t("about.timeline.image"),
      render: (i) =>
        i.image ? (
          <img
            src={i.image}
            alt={resolve(i.title, locale)}
            className="h-10 w-16 rounded object-cover"
          />
        ) : (
          <span className="flex h-10 w-16 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
            <ImageIcon className="h-4 w-4 text-slate-400" />
          </span>
        ),
    },
    {
      key: "year",
      header: t("about.timeline.year"),
      render: (i) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {i.year}
        </span>
      ),
    },
    {
      key: "title",
      header: t("about.timeline.itemTitle"),
      render: (i) => resolve(i.title, locale),
    },
    {
      key: "description",
      header: t("about.timeline.description"),
      render: (i) => (
        <span className="line-clamp-1 max-w-xs">
          {resolve(i.description, locale)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("about.timeline.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        >
          {t("about.timeline.addItem")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={sortedItems}
        isLoading={isLoading}
        errorMessage={hasError ? t("about.timeline.loadError") : null}
        emptyMessage={t("about.timeline.empty")}
        onEdit={(item) => {
          setEditingItem(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingItem}
        actionsHeader={t("about.timeline.actions")}
        editLabel={t("about.timeline.editItem")}
        deleteLabel={t("about.timeline.delete")}
      />

      <TimelineModal
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
        title={t("about.timeline.confirmDeleteTitle")}
        message={t("about.timeline.confirmDeleteMessage", {
          name: deletingItem
            ? resolve(deletingItem.title, locale)
            : "",
        })}
        confirmLabel={t("about.timeline.delete")}
        cancelLabel={t("about.timeline.cancel")}
      />
    </div>
  );
}
