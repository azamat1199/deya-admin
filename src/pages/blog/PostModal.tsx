import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { blogApi } from "../../api/blog";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { slugify } from "../../utils/slugify";
import type { Post } from "../../types/blog";

const translatableField = z
  .object({ ru: z.string(), uz: z.string(), en: z.string() });
const requiredTranslatable = (message: string) =>
  translatableField.refine((v) => Object.values(v).some((x) => x.trim()), {
    message,
  });


const schema = z.object({
  title: requiredTranslatable("titleRequired"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "slugInvalid"),
  excerpt: translatableField,
  published_at: z.string().min(1, "publishedAtRequired"),
});

type FormValues = z.infer<typeof schema>;

/** Formats a Date as the local "YYYY-MM-DDTHH:mm" value a <input type="datetime-local"> expects. */
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function buildEmptyValues(): FormValues {
  return {
    title: { ru: "", uz: "", en: "" },
    slug: "",
    excerpt: { ru: "", uz: "", en: "" },
    published_at: toDatetimeLocalValue(new Date()),
  };
}

export function PostModal({
  isOpen,
  onClose,
  post,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onSaved: (post: Post) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const isEditing = Boolean(post);

  // Tracks whether the user has hand-edited the slug field; once true, the
  // title→slug auto-sync stops so we don't clobber a manual edit.
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildEmptyValues(),
  });

  // useWatch instead of watch(): watch() is not memo-safe and makes
  // React Compiler bail out of optimizing the whole component.
  const watchedValues = useWatch({ control });

   
  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    if (!isOpen) return;
    if (post) {
      reset({
        title: toTranslatable(post.title),
        slug: post.slug,
        excerpt: toTranslatable(post.excerpt),
        published_at: toDatetimeLocalValue(new Date(post.published_at)),
      });
      // Editing an existing post: its slug is already established, so
      // don't let further title edits silently rewrite it.
      setSlugEdited(true);
    } else {
      reset(buildEmptyValues());
      setSlugEdited(false);
    }
    setIsPublished(post?.is_published ?? false);
    setCoverUrl(post?.cover ?? null);
  }, [isOpen, post, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */
   

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: buildTranslatable(values.title, post?.title),
        slug: values.slug,
        excerpt: buildTranslatable(values.excerpt, post?.excerpt),
        published_at: new Date(values.published_at).toISOString(),
        is_published: isPublished,
        ...(coverUrl ? { cover: coverUrl } : {}),
      };
      const { data } = post
        ? await blogApi.updatePost(post.id, payload)
        : await blogApi.createPost(payload);
      toast.success(
        t(post ? "blog.posts.updateSuccess" : "blog.posts.createSuccess"),
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
    message ? t(`blog.posts.${message}`, { defaultValue: message }) : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? "blog.posts.editPost" : "blog.posts.addPost")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TranslatableFields
          fields={["title", "excerpt"]}
          values={watchedValues}
          errors={errors}
        >
          {(locale) => (
            <>
              <Input
                label={`${t("blog.posts.postTitle")} (${locale.toUpperCase()})`}
                error={fieldError(errors.title?.[locale]?.message)}
                {...register(`title.${locale}` as const, {
                  onChange: (e) => {
                    if (!slugEdited && locale === "ru") {
                      setValue("slug", slugify(e.target.value), {
                        shouldValidate: true,
                      });
                    }
                  },
                })}
              />
              <Textarea
                label={`${t("blog.posts.excerpt")} (${locale.toUpperCase()})`}
                error={fieldError(errors.excerpt?.[locale]?.message)}
                {...register(`excerpt.${locale}` as const)}
              />
            </>
          )}
        </TranslatableFields>

        <Input
          label={t("blog.posts.slug")}
          error={fieldError(errors.slug?.message)}
          {...register("slug", {
            onChange: () => setSlugEdited(true),
          })}
        />

        <FileUpload
          label={`${t("blog.posts.cover")} (${t("blog.posts.optional")})`}
          value={coverUrl}
          onChange={setCoverUrl}
          onUploadingChange={setIsUploadingCover}
        />

        <Input
          label={t("blog.posts.publishedAt")}
          type="datetime-local"
          error={fieldError(errors.published_at?.message)}
          {...register("published_at")}
        />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("blog.posts.status")}
          </span>
          <Switch
            checked={isPublished}
            onChange={setIsPublished}
            aria-label={t("blog.posts.status")}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("blog.posts.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingCover}
          >
            {t(isEditing ? "blog.posts.save" : "blog.posts.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
