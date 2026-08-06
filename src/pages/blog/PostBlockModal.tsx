import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { blogApi } from "../../api/blog";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { POST_BLOCK_TYPES, type Post, type PostBlock, type PostBlockType } from "../../types/blog";

const schema = z
  .object({
    post: z.string().regex(/^\d+$/, "postRequired"),
    type: z.enum(POST_BLOCK_TYPES),
    text: z.string(),
    // Soft cap — sort_order's real max is unconfirmed beyond Swagger's
    // generic 32767 example (looks like a SmallIntegerField default).
    sort_order: z.string().regex(/^\d{1,5}$/, "sortOrderInvalid"),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "image" && data.text.trim().length === 0) {
      ctx.addIssue({ code: "custom", path: ["text"], message: "textRequired" });
    }
  });

type FormValues = z.infer<typeof schema>;

function buildEmptyValues(sortOrder: number): FormValues {
  return { post: "", type: "heading", text: "", sort_order: String(sortOrder) };
}

export function PostBlockModal({
  isOpen,
  onClose,
  block,
  nextSortOrder,
  onSaved,
  posts,
  isLoadingPosts,
}: {
  isOpen: boolean;
  onClose: () => void;
  block: PostBlock | null;
  nextSortOrder: number;
  onSaved: (block: PostBlock) => void;
  posts: Post[];
  isLoadingPosts: boolean;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [type, setType] = useState<PostBlockType>("heading");
  const isEditing = Boolean(block);

  const postOptions = useMemo(
    () => posts.map((p) => ({ value: String(p.id), label: p.title })),
    [posts],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildEmptyValues(nextSortOrder),
  });

  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    if (!isOpen) return;
    if (block) {
      reset({
        post: String(block.post),
        type: block.type,
        text: block.text,
        sort_order: String(block.sort_order),
      });
    } else {
      reset(buildEmptyValues(nextSortOrder));
    }
    setType(block?.type ?? "heading");
    setImageUrl(block?.image ?? null);
    setImageError(null);
  }, [isOpen, block, nextSortOrder, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    if (values.type === "image" && !imageUrl) {
      setImageError(t("blog.postBlocks.imageRequired"));
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        post: Number(values.post),
        type: values.type,
        text: values.text,
        sort_order: Number(values.sort_order),
        ...(imageUrl ? { image: imageUrl } : {}),
      };
      const { data } = block
        ? await blogApi.updatePostBlock(block.id, payload)
        : await blogApi.createPostBlock(payload);
      toast.success(
        t(block ? "blog.postBlocks.updateSuccess" : "blog.postBlocks.createSuccess"),
      );
      onSaved(data);
      onClose();
    } catch (error) {
      applyApiFieldErrors<FormValues>(error, setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message
      ? t(`blog.postBlocks.${message}`, { defaultValue: message })
      : undefined;

  const typeOptions = POST_BLOCK_TYPES.map((value) => ({
    value,
    label: t(`blog.postBlocks.type_${value}`),
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(
        isEditing ? "blog.postBlocks.editBlock" : "blog.postBlocks.addBlock",
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="post"
          render={({ field }) => (
            <SearchableSelect
              label={t("blog.postBlocks.post")}
              value={field.value}
              onChange={field.onChange}
              options={postOptions}
              isLoading={isLoadingPosts}
              placeholder={t("blog.postBlocks.selectPost")}
              loadingLabel={t("blog.postBlocks.loadingPosts")}
              searchPlaceholder={t("blog.postBlocks.searchPosts")}
              emptyLabel={t("blog.postBlocks.noPostsFound")}
              error={fieldError(errors.post?.message)}
            />
          )}
        />

        <Select
          label={t("blog.postBlocks.type")}
          options={typeOptions}
          {...register("type", {
            onChange: (e) => setType(e.target.value as PostBlockType),
          })}
        />

        <FileUpload
          label={`${t("blog.postBlocks.image")}${
            type === "image" ? "" : ` (${t("blog.postBlocks.optional")})`
          }`}
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            if (url) setImageError(null);
          }}
          onUploadingChange={setIsUploadingImage}
          error={imageError}
        />

        <Textarea
          label={
            type === "image"
              ? `${t("blog.postBlocks.text")} (${t("blog.postBlocks.optional")})`
              : t("blog.postBlocks.text")
          }
          error={fieldError(errors.text?.message)}
          {...register("text")}
        />

        <Input
          label={t("blog.postBlocks.sortOrder")}
          type="number"
          min={0}
          max={32767}
          error={fieldError(errors.sort_order?.message)}
          {...register("sort_order")}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("blog.postBlocks.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingImage}
          >
            {t(isEditing ? "blog.postBlocks.save" : "blog.postBlocks.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
