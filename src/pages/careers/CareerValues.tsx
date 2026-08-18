import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { CareerValueModal } from "./CareerValueModal";
import { careersApi } from "../../api/careers";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import { useLocale } from "../../hooks/useLocale";
import { tr } from "../../types/i18n";
import type { CareerValue } from "../../types/careers";

export default function CareerValues() {
  const { t, i18n } = useTranslation();
  // Drives re-render on language switch, so titles update without a reload.
  const locale = useLocale();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    careersApi.getCareerValues,
  );

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<CareerValue | null>(null);
  const [deletingValue, setDeletingValue] = useState<CareerValue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    // Search across every locale, not just the active one — an admin looking
    // for a record shouldn't have to switch language to find it.
    return items.filter((v) =>
      [v.title, v.text].some((field) =>
        Object.values(field ?? {}).some((s) =>
          String(s ?? "").toLowerCase().includes(q),
        ),
      ),
    );
  }, [items, search]);

  const handleDeleteConfirm = async () => {
    if (!deletingValue) return;
    setIsDeleting(true);
    try {
      await careersApi.deleteCareerValue(deletingValue.id);
      remove(deletingValue.id);
      toast.success(t("careers.careerValues.deleteSuccess"));
      setDeletingValue(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<CareerValue>[] = [
    {
      key: "image",
      header: t("careers.careerValues.image"),
      render: (v) =>
        v.image ? (
          <img
            src={v.image}
            // alt must be a string — tr(), never the raw object.
            alt={tr(v.title, locale)}
            loading="lazy"
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
      header: t("careers.careerValues.valueTitle"),
      render: (v) => (
        <span className="text-slate-900 dark:text-white">
          {tr(v.title, locale)}
        </span>
      ),
    },
    {
      key: "text",
      header: t("careers.careerValues.text"),
      render: (v) => (
        <span className="line-clamp-1 max-w-xs">{tr(v.text, locale)}</span>
      ),
    },
    {
      key: "created_at",
      header: t("careers.careerValues.createdAt"),
      render: (v) =>
        v.created_at
          ? new Date(v.created_at).toLocaleDateString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("careers.careerValues.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingValue(null);
            setIsModalOpen(true);
          }}
        >
          {t("careers.careerValues.addValue")}
        </Button>
      </div>

      <Card className="mb-4 p-4">
        <Input
          label={t("careers.careerValues.search")}
          placeholder={t("careers.careerValues.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <DataTable
        columns={columns}
        items={filteredItems}
        isLoading={isLoading}
        errorMessage={hasError ? t("careers.careerValues.loadError") : null}
        emptyMessage={
          search
            ? t("careers.careerValues.noSearchResults")
            : t("careers.careerValues.empty")
        }
        onEdit={(value) => {
          setEditingValue(value);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingValue}
        actionsHeader={t("careers.careerValues.actions")}
        editLabel={t("careers.careerValues.editValue")}
        deleteLabel={t("careers.careerValues.delete")}
      />

      <CareerValueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        value={editingValue}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingValue)}
        onClose={() => setDeletingValue(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("careers.careerValues.confirmDeleteTitle")}
        message={t("careers.careerValues.confirmDeleteMessage", {
          // Interpolating the raw object here is the classic source of the
          // "Objects are not valid as a React child" crash.
          name: tr(deletingValue?.title, locale),
        })}
        confirmLabel={t("careers.careerValues.delete")}
        cancelLabel={t("careers.careerValues.cancel")}
      />
    </div>
  );
}
