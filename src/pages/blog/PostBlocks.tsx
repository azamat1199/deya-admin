import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { PostBlockModal } from "./PostBlockModal";
import { blogApi } from "../../api/blog";
import { getApiErrorMessage } from "../../api/client";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import { useCrudList } from "../../hooks/useCrudList";
import type { PostBlock } from "../../types/blog";

export default function PostBlocks() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const { items, isLoading, hasError, upsert, remove } = useCrudList(
    blogApi.getPostBlocks,
  );
  const { items: posts, isLoading: isLoadingPosts } = useCrudList(
    blogApi.getPosts,
  );

  const postTitleById = useMemo(
    () => new Map(posts.map((p) => [p.id, resolve(p.title, locale)])),
    [posts, locale],
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
  const [editingBlock, setEditingBlock] = useState<PostBlock | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<PostBlock | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingBlock) return;
    setIsDeleting(true);
    try {
      await blogApi.deletePostBlock(deletingBlock.id);
      remove(deletingBlock.id);
      toast.success(t("blog.postBlocks.deleteSuccess"));
      setDeletingBlock(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<PostBlock>[] = [
    {
      key: "post",
      header: t("blog.postBlocks.post"),
      render: (b) => postTitleById.get(b.post) ?? `#${b.post}`,
    },
    {
      key: "type",
      header: t("blog.postBlocks.type"),
      render: (b) => (
        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {t(`blog.postBlocks.type_${b.type}`)}
        </span>
      ),
    },
    {
      key: "text",
      header: t("blog.postBlocks.text"),
      render: (b) => (
        <span className="line-clamp-1 max-w-xs">{resolve(b.text, locale)}</span>
      ),
    },
    {
      key: "image",
      header: t("blog.postBlocks.image"),
      render: (b) =>
        b.image ? (
          <img
            src={b.image}
            alt=""
            className="h-10 w-16 rounded object-cover"
          />
        ) : (
          <span className="flex h-10 w-16 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
            <ImageIcon className="h-4 w-4 text-slate-400" />
          </span>
        ),
    },
    {
      key: "sort_order",
      header: t("blog.postBlocks.sortOrder"),
      render: (b) => b.sort_order,
    },
    {
      key: "created_at",
      header: t("blog.postBlocks.createdAt"),
      render: (b) =>
        b.created_at
          ? new Date(b.created_at).toLocaleDateString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("blog.postBlocks.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingBlock(null);
            setIsModalOpen(true);
          }}
        >
          {t("blog.postBlocks.addBlock")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={sortedItems}
        isLoading={isLoading}
        errorMessage={hasError ? t("blog.postBlocks.loadError") : null}
        emptyMessage={t("blog.postBlocks.empty")}
        onEdit={(block) => {
          setEditingBlock(block);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingBlock}
        actionsHeader={t("blog.postBlocks.actions")}
        editLabel={t("blog.postBlocks.editBlock")}
        deleteLabel={t("blog.postBlocks.delete")}
      />

      <PostBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        block={editingBlock}
        nextSortOrder={nextSortOrder}
        onSaved={upsert}
        posts={posts}
        isLoadingPosts={isLoadingPosts}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingBlock)}
        onClose={() => setDeletingBlock(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("blog.postBlocks.confirmDeleteTitle")}
        message={t("blog.postBlocks.confirmDeleteMessage", {
          name: deletingBlock ? `#${deletingBlock.id}` : "",
        })}
        confirmLabel={t("blog.postBlocks.delete")}
        cancelLabel={t("blog.postBlocks.cancel")}
      />
    </div>
  );
}
