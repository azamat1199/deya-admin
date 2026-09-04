import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
// Lives under Careers in the UI, but the backend has no /careers/ endpoint
// for it — this reads/writes /api/v1/admin/about/product-info/, unchanged.
import { aboutApi } from "../../api/about";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import type { PatchProductInfoRequest, ProductInfo } from "../../types/about";

const translatableField = z.object({ ru: z.string(), uz: z.string(), en: z.string() });
const requiredTranslatable = (message: string) =>
  translatableField.refine((v) => Object.values(v).some((x) => x.trim()), {
    message,
  });

const schema = z.object({
  // description is optional per the schema (not in its `required` list);
  // title is required there, so it stays required here too.
  title: requiredTranslatable("titleRequired"),
  description: translatableField,
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  title: { ru: "", uz: "", en: "" },
  description: { ru: "", uz: "", en: "" },
};

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. No entry exists yet in
    locale-support.ts — unmeasured, so this falls back to the full set. */
const locales = localesFor("about/product-info");

/**
 * TipTap's empty document still emits "<p></p>", not "". Left alone, that
 * would make an untouched editor register as "filled" for the completion
 * dots, and would write literal "<p></p>" instead of "" to the API.
 */
function normalizeRichText(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim() ? html : "";
}

export function ProductInfoModal({
  isOpen,
  onClose,
  item,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: ProductInfo | null;
  onSaved: (item: ProductInfo) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // Only send `image` when the user actually changed it: re-sending the
  // stored URL unconditionally is the bug that hit CompanyModal.
  const [imageDirty, setImageDirty] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const isEditing = Boolean(item);

  const {
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
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
      // Full objects — resolving to one string here would wipe the other
      // languages, on both fields, on the next save.
      reset({
        title: toTranslatable(item.title),
        description: toTranslatable(item.description),
      });
    } else {
      reset(emptyValues);
    }
    setImageUrl(item?.image ?? null);
    setImageDirty(false);
    setImageError(null);
  }, [isOpen, item, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    if (!isEditing && !imageUrl) {
      setImageError(t("careers.productInfo.imageRequired"));
      return;
    }
    setImageError(null);
    setIsSubmitting(true);
    try {
      if (item) {
        // PATCH /{id}/ — never PUT: a full replace risks overwriting a
        // language the editor never opened.
        const payload: PatchProductInfoRequest = {
          title: buildTranslatable(values.title, item.title, locales),
          description: buildTranslatable(values.description, item.description, locales),
          ...(imageDirty ? { image: imageUrl } : {}),
        };
        const { data } = await aboutApi.patchProductInfo(item.id, payload);
        toast.success(t("careers.productInfo.updateSuccess"));
        onSaved(data);
      } else {
        const { data } = await aboutApi.createProductInfo({
          title: buildTranslatable(values.title, null, locales),
          description: buildTranslatable(values.description, null, locales),
          image: imageUrl as string,
        });
        toast.success(t("careers.productInfo.createSuccess"));
        onSaved(data);
      }
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
      ? t(`careers.productInfo.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? "careers.productInfo.editItem" : "careers.productInfo.addItem")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FileUpload
          label={t("careers.productInfo.image")}
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            setImageDirty(true);
            if (imageError) setImageError(null);
          }}
          onUploadingChange={setIsUploadingImage}
          accept="image/*"
          error={imageError}
        />

        <TranslatableFields
          locales={locales}
          fields={["title", "description"]}
          values={watchedValues}
          errors={errors}
        >
          {(locale) => (
            <>
              <RichTextEditor
                label={`${t("careers.productInfo.itemTitle")} (${locale.toUpperCase()})`}
                value={watchedValues.title?.[locale] ?? ""}
                onChange={(html) =>
                  setValue(`title.${locale}` as const, normalizeRichText(html), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={fieldError(errors.title?.[locale]?.message)}
              />
              <RichTextEditor
                label={`${t("careers.productInfo.description")} (${locale.toUpperCase()})`}
                value={watchedValues.description?.[locale] ?? ""}
                onChange={(html) =>
                  setValue(`description.${locale}` as const, normalizeRichText(html), {
                    shouldDirty: true,
                  })
                }
                error={fieldError(errors.description?.[locale]?.message)}
              />
            </>
          )}
        </TranslatableFields>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("careers.productInfo.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingImage}
          >
            {t(isEditing ? "careers.productInfo.save" : "careers.productInfo.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
