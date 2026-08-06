import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { SlideModal } from "./SlideModal";
import { aboutApi } from "../../api/about";
import { getApiErrorMessage } from "../../api/client";
import { useCrudList } from "../../hooks/useCrudList";
import { toLocalizedText } from "../../utils/localized";
import type { Slide } from "../../types/about";

function localizedTitle(slide: Slide, lang: string): string {
  const title = toLocalizedText(slide.title);
  return (lang === "ru" ? title.ru : title.uz) || title.uz || title.ru;
}

export default function Slides() {
  const { t, i18n } = useTranslation();
  const { items, isLoading, hasError, upsert, replace, remove } = useCrudList(
    aboutApi.getSlides,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [deletingSlide, setDeletingSlide] = useState<Slide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingSlide) return;
    setIsDeleting(true);
    try {
      await aboutApi.deleteSlide(deletingSlide.id);
      remove(deletingSlide.id);
      toast.success(t("about.slides.deleteSuccess"));
      setDeletingSlide(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (slide: Slide) => {
    const nextActive = !slide.is_active;
    replace(slide.id, (s) => ({ ...s, is_active: nextActive }));
    try {
      await aboutApi.patchSlide(slide.id, { is_active: nextActive });
    } catch {
      replace(slide.id, (s) => ({ ...s, is_active: slide.is_active }));
      toast.error(t("about.slides.statusUpdateError"));
    }
  };

  const columns: Column<Slide>[] = [
    {
      key: "image",
      header: t("about.slides.image"),
      render: (s) =>
        s.image ? (
          <img
            src={s.image}
            alt={localizedTitle(s, i18n.language)}
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
      header: t("about.slides.slideTitle"),
      render: (s) => (
        <span className="text-slate-900 dark:text-white">
          {localizedTitle(s, i18n.language)}
        </span>
      ),
    },
    {
      key: "order",
      header: t("about.slides.order"),
      render: (s) => s.order,
    },
    {
      key: "status",
      header: t("about.slides.status"),
      render: (s) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={s.is_active}
            onChange={() => handleToggleStatus(s)}
            aria-label={t("about.slides.status")}
          />
          <span>
            {t(s.is_active ? "about.slides.active" : "about.slides.inactive")}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("about.slides.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingSlide(null);
            setIsModalOpen(true);
          }}
        >
          {t("about.slides.addSlide")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("about.slides.loadError") : null}
        emptyMessage={t("about.slides.empty")}
        onEdit={(slide) => {
          setEditingSlide(slide);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingSlide}
        actionsHeader={t("about.slides.actions")}
        editLabel={t("about.slides.editSlide")}
        deleteLabel={t("about.slides.delete")}
      />

      <SlideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slide={editingSlide}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSlide)}
        onClose={() => setDeletingSlide(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("about.slides.confirmDeleteTitle")}
        message={t("about.slides.confirmDeleteMessage", {
          name: deletingSlide ? localizedTitle(deletingSlide, i18n.language) : "",
        })}
        confirmLabel={t("about.slides.delete")}
        cancelLabel={t("about.slides.cancel")}
      />
    </div>
  );
}
