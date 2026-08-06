import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { WeightModal } from "./WeightModal";
import { catalogApi } from "../../api/catalog";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import type { Weight } from "../../types/catalog";

export default function Weights() {
  const { t, i18n } = useTranslation();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    catalogApi.getWeights,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<Weight | null>(null);
  const [deletingWeight, setDeletingWeight] = useState<Weight | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingWeight) return;
    setIsDeleting(true);
    try {
      await catalogApi.deleteWeight(deletingWeight.id);
      remove(deletingWeight.id);
      toast.success(t("catalog.weights.deleteSuccess"));
      setDeletingWeight(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Weight>[] = [
    {
      key: "value",
      header: t("catalog.weights.value"),
      render: (w) => (
        <span className="text-slate-900 dark:text-white">
          {w.value} {t(`catalog.weights.unit_${w.unit}`, { defaultValue: w.unit })}
        </span>
      ),
    },
    {
      key: "created_at",
      header: t("catalog.weights.createdAt"),
      render: (w) =>
        w.created_at
          ? new Date(w.created_at).toLocaleDateString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("catalog.weights.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingWeight(null);
            setIsModalOpen(true);
          }}
        >
          {t("catalog.weights.add")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("catalog.weights.loadError") : null}
        emptyMessage={t("catalog.weights.empty")}
        onEdit={(weight) => {
          setEditingWeight(weight);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingWeight}
        actionsHeader={t("catalog.weights.actions")}
        editLabel={t("catalog.weights.edit")}
        deleteLabel={t("catalog.weights.delete")}
      />

      <WeightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weight={editingWeight}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingWeight)}
        onClose={() => setDeletingWeight(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("catalog.weights.confirmDeleteTitle")}
        message={t("catalog.weights.confirmDeleteMessage", {
          name: deletingWeight ? `${deletingWeight.value} ${deletingWeight.unit}` : "",
        })}
        confirmLabel={t("catalog.weights.delete")}
        cancelLabel={t("catalog.weights.cancel")}
      />
    </div>
  );
}
