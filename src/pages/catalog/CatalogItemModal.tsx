import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { slugify } from "../../utils/slugify";
import type { CatalogItemBase, CatalogItemPayload } from "../../types/catalog";

const schema = z.object({
  name: z.string().min(1, "nameRequired"),
  slug: z.string().regex(/^[a-zA-Z0-9_-]+$/, "slugInvalid"),
  // Soft cap — sort_order's real max is unconfirmed beyond Swagger's
  // generic 32767 example (looks like a SmallIntegerField default).
  sort_order: z.string().regex(/^\d{1,5}$/, "sortOrderInvalid"),
});

type FormValues = z.infer<typeof schema>;

function buildEmptyValues(sortOrder: number): FormValues {
  return { name: "", slug: "", sort_order: String(sortOrder) };
}

/** Add/edit form shared by every simple catalog resource (Categories,
 * Flavors, ...) — they all use the same name/slug/image/sort_order/
 * is_active shape, so one form serves all of them via `i18nNamespace`. */
export function CatalogItemModal<T extends CatalogItemBase>({
  isOpen,
  onClose,
  item,
  nextSortOrder,
  onSaved,
  i18nNamespace,
  create,
  update,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: T | null;
  nextSortOrder: number;
  onSaved: (item: T) => void;
  i18nNamespace: string;
  create: (payload: CatalogItemPayload) => Promise<{ data: T }>;
  update: (id: number, payload: CatalogItemPayload) => Promise<{ data: T }>;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const isEditing = Boolean(item);

  // Tracks whether the user has hand-edited the slug field; once true, the
  // name→slug auto-sync stops so we don't clobber a manual edit.
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
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
    if (item) {
      reset({
        name: item.name,
        slug: item.slug,
        sort_order: String(item.sort_order),
      });
      // Editing an existing item: its slug is already established, so
      // don't let further name edits silently rewrite it.
      setSlugEdited(true);
    } else {
      reset(buildEmptyValues(nextSortOrder));
      setSlugEdited(false);
    }
    setIsActive(item?.is_active ?? true);
    setImageUrl(item?.image ?? null);
  }, [isOpen, item, nextSortOrder, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: CatalogItemPayload = {
        name: values.name,
        slug: values.slug,
        sort_order: Number(values.sort_order),
        is_active: isActive,
        ...(imageUrl ? { image: imageUrl } : {}),
      };
      const { data } = item
        ? await update(item.id, payload)
        : await create(payload);
      toast.success(
        t(item ? `${i18nNamespace}.updateSuccess` : `${i18nNamespace}.createSuccess`),
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
      ? t(`${i18nNamespace}.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? `${i18nNamespace}.edit` : `${i18nNamespace}.add`)}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label={t(`${i18nNamespace}.name`)}
          error={fieldError(errors.name?.message)}
          {...register("name", {
            onChange: (e) => {
              if (!slugEdited) {
                setValue("slug", slugify(e.target.value), {
                  shouldValidate: true,
                });
              }
            },
          })}
        />

        <Input
          label={t(`${i18nNamespace}.slug`)}
          error={fieldError(errors.slug?.message)}
          {...register("slug", {
            onChange: () => setSlugEdited(true),
          })}
        />

        <FileUpload
          label={`${t(`${i18nNamespace}.image`)} (${t(`${i18nNamespace}.optional`)})`}
          value={imageUrl}
          onChange={setImageUrl}
          onUploadingChange={setIsUploadingImage}
        />

        <Input
          label={t(`${i18nNamespace}.sortOrder`)}
          type="number"
          min={0}
          max={32767}
          error={fieldError(errors.sort_order?.message)}
          {...register("sort_order")}
        />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t(`${i18nNamespace}.status`)}
          </span>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            aria-label={t(`${i18nNamespace}.status`)}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t(`${i18nNamespace}.cancel`)}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingImage}
          >
            {t(isEditing ? `${i18nNamespace}.save` : `${i18nNamespace}.create`)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
