import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { pagesApi } from "../../api/pages";
import { getApiErrorMessage } from "../../api/client";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import { useCrudList } from "../../hooks/useCrudList";
import type { StaticPage } from "../../types/pages";

export default function StaticPages() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const { items, isLoading, hasError, remove } = useCrudList(
    pagesApi.getStaticPages,
  );

  const [deletingPage, setDeletingPage] = useState<StaticPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingPage) return;
    setIsDeleting(true);
    try {
      await pagesApi.deleteStaticPage(deletingPage.id);
      remove(deletingPage.id);
      toast.success(t("pages.staticPages.deleteSuccess"));
      setDeletingPage(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<StaticPage>[] = [
    {
      key: "title",
      header: t("pages.staticPages.pageTitle"),
      render: (p) => (
        <span className="text-slate-900 dark:text-white">{resolve(p.title, locale)}</span>
      ),
    },
    {
      key: "slug",
      header: t("pages.staticPages.slug"),
      render: (p) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {p.slug}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: t("pages.staticPages.updatedAt"),
      render: (p) =>
        p.updated_at
          ? new Date(p.updated_at).toLocaleString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("pages.staticPages.title")}
        </h2>
        <Button onClick={() => navigate("/pages/static-pages/create")}>
          {t("pages.staticPages.addPage")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("pages.staticPages.loadError") : null}
        emptyMessage={t("pages.staticPages.empty")}
        onEdit={(page) => navigate(`/pages/static-pages/${page.id}/edit`)}
        onDelete={setDeletingPage}
        actionsHeader={t("pages.staticPages.actions")}
        editLabel={t("pages.staticPages.editPage")}
        deleteLabel={t("pages.staticPages.delete")}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingPage)}
        onClose={() => setDeletingPage(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("pages.staticPages.confirmDeleteTitle")}
        message={t("pages.staticPages.confirmDeleteMessage", {
          name: resolve(deletingPage?.title, locale),
        })}
        confirmLabel={t("pages.staticPages.delete")}
        cancelLabel={t("pages.staticPages.cancel")}
      />
    </div>
  );
}
