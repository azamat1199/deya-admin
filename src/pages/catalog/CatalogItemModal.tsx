import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import { slugify } from "../../utils/slugify";
import type { CatalogListItem, CatalogWritePayloadBase } from "../../types/catalog";

// `name` is admin-authored free text -> translatable. slug / sort_order /
// is_active / image are structural and stay plain.
const translatable = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
});

const schema = z.object({
  name: translatable.refine((v) => Object.values(v).some((x) => x.trim()), {
    message: "nameRequired",
  }),
  slug: z.string().regex(/^[a-zA-Z0-9_-]+$/, "slugInvalid"),
  // Soft cap — sort_order's real max is unconfirmed beyond Swagger's
  // generic 32767 example (looks like a SmallIntegerField default).
  sort_order: z.string().regex(/^\d{1,5}$/, "sortOrderInvalid"),
});

type FormValues = z.infer<typeof schema>;

function buildEmptyValues(sortOrder: number): FormValues {
  return {
    name: { ru: "", uz: "", en: "" },
    slug: "",
    sort_order: String(sortOrder),
  };
}

/** Fields present on `item`/the payload only for resources that have them.
 * `T`/`P` don't statically carry image/is_active (Flavor has neither), so
 * reading or building them is gated behind `hasImage`/`hasIsActive` and
 * narrowed through this rather than widening the shared types themselves. */
interface OptionalCatalogFields {
  image?: string;
  is_active?: boolean;
}

/** Add/edit form shared by every simple catalog resource (Categories,
 * Flavors, ...). `hasImage`/`hasIsActive` say which of the two
 * resource-specific fields this instance actually has — Categories passes
 * both true, Flavors both false. Everything else (name/slug/sort_order) is
 * unconditional because every simple catalog resource has it. */
export function CatalogItemModal<
  T extends CatalogListItem,
  P extends CatalogWritePayloadBase,
>({
  isOpen,
  onClose,
  item,
  nextSortOrder,
  onSaved,
  i18nNamespace,
  localeKey,
  hasImage,
  hasIsActive,
  create,
  update,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: T | null;
  nextSortOrder: number;
  onSaved: (item: T) => void;
  i18nNamespace: string;
  /** locale-support key for this resource, e.g. "catalog/categories". */
  localeKey: string;
  hasImage: boolean;
  hasIsActive: boolean;
  create: (payload: P) => Promise<{ data: T }>;
  update: (id: number, payload: P) => Promise<{ data: T }>;
}) {
  const { t } = useTranslation();
  const locales = localesFor(localeKey);
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
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildEmptyValues(nextSortOrder),
  });

  // useWatch instead of watch(): watch() is not memo-safe and makes
  // React Compiler bail out of optimizing the whole component.
  const watchedValues = useWatch({ control });


  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      reset({
        // full object in state — never resolve to a string on load
        name: toTranslatable(item.name),
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
    const optional = item as (T & OptionalCatalogFields) | null;
    if (hasIsActive) setIsActive(optional?.is_active ?? true);
    if (hasImage) setImageUrl(optional?.image ?? null);
  }, [isOpen, item, nextSortOrder, reset, hasImage, hasIsActive]);
  /* eslint-enable react-hooks/set-state-in-effect */


  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // `P` is whichever resource's real payload type the caller passed
      // (CategoryPayload or FlavorPayload) — image/is_active are added only
      // when this instance actually has them, so the object this builds
      // always matches what P requires. The cast bridges that: hasImage/
      // hasIsActive and P are supplied together by the same caller
      // (Categories.tsx / Flavors.tsx), a correlation the type system has
      // no way to see from inside a shared generic component.
      const payload = {
        name: buildTranslatable(values.name, item?.name, locales),
        slug: values.slug,
        sort_order: Number(values.sort_order),
        ...(hasIsActive ? { is_active: isActive } : {}),
        ...(hasImage && imageUrl ? { image: imageUrl } : {}),
      } as P;
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
        <TranslatableFields
          locales={locales}
          fields={["name"]}
          values={watchedValues}
          errors={errors}
        >
          {(locale) => (
            <Input
              label={`${t(`${i18nNamespace}.name`)} (${locale.toUpperCase()})`}
              error={fieldError(errors.name?.[locale]?.message)}
              {...register(`name.${locale}` as const, {
                onChange: (e) => {
                  // slug is derived from the RU value only — it is a
                  // structural field, not one value per language.
                  if (!slugEdited && locale === "ru") {
                    setValue("slug", slugify(e.target.value), {
                      shouldValidate: true,
                    });
                  }
                },
              })}
            />
          )}
        </TranslatableFields>

        <Input
          label={t(`${i18nNamespace}.slug`)}
          error={fieldError(errors.slug?.message)}
          {...register("slug", {
            onChange: () => setSlugEdited(true),
          })}
        />

        {hasImage && (
          <FileUpload
            label={`${t(`${i18nNamespace}.image`)} (${t(`${i18nNamespace}.optional`)})`}
            value={imageUrl}
            onChange={setImageUrl}
            onUploadingChange={setIsUploadingImage}
          />
        )}

        <Input
          label={t(`${i18nNamespace}.sortOrder`)}
          type="number"
          min={0}
          max={32767}
          error={fieldError(errors.sort_order?.message)}
          {...register("sort_order")}
        />

        {hasIsActive && (
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
        )}

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
