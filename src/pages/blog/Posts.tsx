import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { PostModal } from "./PostModal";
import { blogApi } from "../../api/blog";
import { getApiErrorMessage } from "../../api/client";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import { useCrudList } from "../../hooks/useCrudList";
import type { Post } from "../../types/blog";

export default function Posts() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const { items, isLoading, hasError, upsert, replace, remove } = useCrudList(
    blogApi.getPosts,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingPost) return;
    setIsDeleting(true);
    try {
      await blogApi.deletePost(deletingPost.id);
      remove(deletingPost.id);
      toast.success(t("blog.posts.deleteSuccess"));
      setDeletingPost(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublished = async (post: Post) => {
    const nextPublished = !post.is_published;
    replace(post.id, (p) => ({ ...p, is_published: nextPublished }));
    try {
      await blogApi.patchPost(post.id, { is_published: nextPublished });
    } catch {
      replace(post.id, (p) => ({ ...p, is_published: post.is_published }));
      toast.error(t("blog.posts.statusUpdateError"));
    }
  };

  const columns: Column<Post>[] = [
    {
      key: "cover",
      header: t("blog.posts.cover"),
      render: (p) =>
        p.cover ? (
          <img
            src={p.cover}
            alt={resolve(p.title, locale)}
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
      header: t("blog.posts.postTitle"),
      render: (p) => (
        <span className="line-clamp-1 max-w-xs text-slate-900 dark:text-white">
          {resolve(p.title, locale)}
        </span>
      ),
    },
    {
      key: "slug",
      header: t("blog.posts.slug"),
      render: (p) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {p.slug}
        </span>
      ),
    },
    {
      key: "is_published",
      header: t("blog.posts.status"),
      render: (p) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={p.is_published}
            onChange={() => handleTogglePublished(p)}
            aria-label={t("blog.posts.status")}
          />
          <span>
            {t(p.is_published ? "blog.posts.published" : "blog.posts.draft")}
          </span>
        </div>
      ),
    },
    {
      key: "published_at",
      header: t("blog.posts.publishedAt"),
      render: (p) =>
        p.published_at
          ? new Date(p.published_at).toLocaleString(i18n.language)
          : "—",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("blog.posts.title")}
        </h2>
        <Button
          onClick={() => {
            setEditingPost(null);
            setIsModalOpen(true);
          }}
        >
          {t("blog.posts.addPost")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("blog.posts.loadError") : null}
        emptyMessage={t("blog.posts.empty")}
        onEdit={(post) => {
          setEditingPost(post);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingPost}
        actionsHeader={t("blog.posts.actions")}
        editLabel={t("blog.posts.editPost")}
        deleteLabel={t("blog.posts.delete")}
      />

      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        post={editingPost}
        onSaved={upsert}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingPost)}
        onClose={() => setDeletingPost(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={t("blog.posts.confirmDeleteTitle")}
        message={t("blog.posts.confirmDeleteMessage", {
          name: resolve(deletingPost?.title, locale),
        })}
        confirmLabel={t("blog.posts.delete")}
        cancelLabel={t("blog.posts.cancel")}
      />
    </div>
  );
}
