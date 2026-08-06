import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { CareerValueModal } from "./CareerValueModal";
import { careersApi } from "../../api/careers";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import type { CareerValue } from "../../types/careers";

export default function CareerValues() {
  const { t, i18n } = useTranslation();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    careersApi.getCareerValues,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<CareerValue | null>(null);
  const [deletingValue, setDeletingValue] = useState<CareerValue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
            alt={v.title}
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
        <span className="text-slate-900 dark:text-white">{v.title}</span>
      ),
    },
    {
      key: "text",
      header: t("careers.careerValues.text"),
      render: (v) => <span className="line-clamp-1 max-w-xs">{v.text}</span>,
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

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("careers.careerValues.loadError") : null}
        emptyMessage={t("careers.careerValues.empty")}
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
          name: deletingValue?.title ?? "",
        })}
        confirmLabel={t("careers.careerValues.delete")}
        cancelLabel={t("careers.careerValues.cancel")}
      />
    </div>
  );
}
