import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { ExportRegionModal } from "./ExportRegionModal";
import { aboutApi } from "../../api/about";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import type { ExportRegion } from "../../types/about";

export default function ExportRegions() {
  const { t } = useTranslation();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    aboutApi.getExportRegions,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<ExportRegion | null>(
    null,
  );
  const [deletingRegion, setDeletingRegion] = useState<ExportRegion | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingRegion) return;
    setIsDeleting(true);
    try {
      await aboutApi.deleteExportRegion(deletingRegion.id);
      remove(deletingRegion.id);
      toast.success(t("about.exportRegions.deleteSuccess"));
      setDeletingRegion(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<ExportRegion>[] = [
    {
      key: "name",
      header: t("about.exportRegions.name"),
      render: (r) => (
        <span className="text-slate-900 dark:text-white">{r.name}</span>
      ),
    },
    {
      key: "position_x",
      header: t("about.exportRegions.positionX"),
      render: (r) => r.position_x,
    },
    {
      key: "position_y",
      header: t("about.exportRegions.positionY"),
      render: (r) => r.position_y,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("about.exportRegions.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingRegion(null);
            setIsModalOpen(true);
          }}
        >
          {t("about.exportRegions.addRegion")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("about.exportRegions.loadError") : null}
        emptyMessage={t("about.exportRegions.empty")}
        onEdit={(region) => {
          setEditingRegion(region);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingRegion}
        actionsHeader={t("about.exportRegions.actions")}
        editLabel={t("about.exportRegions.editRegion")}
        deleteLabel={t("about.exportRegions.delete")}
      />

      <ExportRegionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        region={editingRegion}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingRegion)}
        onClose={() => setDeletingRegion(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("about.exportRegions.confirmDeleteTitle")}
        message={t("about.exportRegions.confirmDeleteMessage", {
          name: deletingRegion?.name ?? "",
        })}
        confirmLabel={t("about.exportRegions.delete")}
        cancelLabel={t("about.exportRegions.cancel")}
      />
    </div>
  );
}
