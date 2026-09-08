import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ExternalLink, ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { bannersApi } from "../../api/banners";
import { getApiErrorMessage } from "../../api/client";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import { useCrudList } from "../../hooks/useCrudList";
import { bannerTypeLabelKey } from "../../constants/bannerType";
import type { Banner } from "../../types/banners";

export default function Banners() {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const { items, isLoading, hasError, remove } = useCrudList(
    bannersApi.getBanners,
  );

  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingBanner) return;
    setIsDeleting(true);
    try {
      await bannersApi.deleteBanner(deletingBanner.id);
      remove(deletingBanner.id);
      toast.success(t("pages.banners.deleteSuccess"));
      setDeletingBanner(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Banner>[] = [
    {
      key: "type",
      header: t("pages.banners.type"),
      render: (b) => t(bannerTypeLabelKey(b.type)),
    },
    {
      key: "image",
      header: t("pages.banners.image"),
      render: (b) =>
        b.image ? (
          <img
            src={b.image}
            alt={resolve(b.title, locale)}
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
      header: t("pages.banners.pageTitle"),
      render: (b) => (
        <span className="text-slate-900 dark:text-white">
          {resolve(b.title, locale)}
        </span>
      ),
    },
    {
      key: "subtitle",
      header: t("pages.banners.subtitle"),
      render: (b) => (
        <span className="line-clamp-1 max-w-xs">{resolve(b.subtitle, locale)}</span>
      ),
    },
    {
      key: "cta_url",
      header: t("pages.banners.ctaUrl"),
      render: (b) =>
        b.cta_url ? (
          <a
            href={b.cta_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-48 items-center gap-1 truncate text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{b.cta_url}</span>
          </a>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("pages.banners.title")}
        </h2>
        <Button onClick={() => navigate("/pages/banners/create")}>
          {t("pages.banners.addBanner")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("pages.banners.loadError") : null}
        emptyMessage={t("pages.banners.empty")}
        onEdit={(banner) => navigate(`/pages/banners/${banner.id}/edit`)}
        onDelete={setDeletingBanner}
        actionsHeader={t("pages.banners.actions")}
        editLabel={t("pages.banners.editBanner")}
        deleteLabel={t("pages.banners.delete")}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingBanner)}
        onClose={() => setDeletingBanner(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("pages.banners.confirmDeleteTitle")}
        message={t("pages.banners.confirmDeleteMessage", {
          name: resolve(deletingBanner?.title, locale),
        })}
        confirmLabel={t("pages.banners.delete")}
        cancelLabel={t("pages.banners.cancel")}
      />
    </div>
  );
}
