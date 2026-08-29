import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { StatModal } from "./StatModal";
import { aboutApi } from "../../api/about";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import type { Stat } from "../../types/about";

export default function Stats() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { items, isLoading, hasError, upsert, replace, remove } = useCrudList(
    aboutApi.getStats,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<Stat | null>(null);
  const [deletingStat, setDeletingStat] = useState<Stat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingStat) return;
    setIsDeleting(true);
    try {
      await aboutApi.deleteStat(deletingStat.id);
      remove(deletingStat.id);
      toast.success(t("about.stats.deleteSuccess"));
      setDeletingStat(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (stat: Stat) => {
    const nextActive = !stat.is_active;
    replace(stat.id, (s) => ({ ...s, is_active: nextActive }));
    try {
      await aboutApi.patchStat(stat.id, { is_active: nextActive });
    } catch {
      replace(stat.id, (s) => ({ ...s, is_active: stat.is_active }));
      toast.error(t("about.stats.statusUpdateError"));
    }
  };

  const columns: Column<Stat>[] = [
    {
      key: "label",
      header: t("about.stats.statTitle"),
      render: (s) => (
        <span className="text-slate-900 dark:text-white">
          {resolve(s.label, locale)}
        </span>
      ),
    },
    {
      key: "value",
      header: t("about.stats.value"),
      render: (s) => s.value,
    },
    {
      key: "status",
      header: t("about.stats.status"),
      render: (s) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={s.is_active}
            onChange={() => handleToggleStatus(s)}
            aria-label={t("about.stats.status")}
          />
          <span>
            {t(s.is_active ? "about.stats.active" : "about.stats.inactive")}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("about.stats.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingStat(null);
            setIsModalOpen(true);
          }}
        >
          {t("about.stats.addStat")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("about.stats.loadError") : null}
        emptyMessage={t("about.stats.empty")}
        onEdit={(stat) => {
          setEditingStat(stat);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingStat}
        actionsHeader={t("about.stats.actions")}
        editLabel={t("about.stats.editStat")}
        deleteLabel={t("about.stats.delete")}
      />

      <StatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stat={editingStat}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingStat)}
        onClose={() => setDeletingStat(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("about.stats.confirmDeleteTitle")}
        message={t("about.stats.confirmDeleteMessage", {
          name: deletingStat ? resolve(deletingStat.label, locale) : "",
        })}
        confirmLabel={t("about.stats.delete")}
        cancelLabel={t("about.stats.cancel")}
      />
    </div>
  );
}
