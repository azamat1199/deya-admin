import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { aboutApi } from "../../api/about";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import type { TimelineItem } from "../../types/about";

const translatableField = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
});
const requiredTranslatable = (message: string) =>
  translatableField.refine((v) => Object.values(v).some((x) => x.trim()), {
    message,
  });

const schema = z.object({
  year: z.string().regex(/^\d{4}$/, "yearInvalid"),
  title: requiredTranslatable("titleRequired"),
  description: requiredTranslatable("descriptionRequired"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  year: String(new Date().getFullYear()),
  title: { ru: "", uz: "", en: "" },
  description: { ru: "", uz: "", en: "" },
};

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor("about/timeline");

export function TimelineModal({
  isOpen,
  onClose,
  item,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: TimelineItem | null;
  onSaved: (item: TimelineItem) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isEditing = Boolean(item);

  const {
    register,
    handleSubmit,
    reset,
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
      reset({
        year: String(item.year),
        // full objects — the previous code resolved to one string here,
        // which wiped the other languages on the next save.
        title: toTranslatable(item.title),
        description: toTranslatable(item.description),
      });
    } else {
      reset(emptyValues);
    }
    setImageUrl(item?.image ?? null);
  }, [isOpen, item, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */
   

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        year: Number(values.year),
        title: buildTranslatable(values.title, item?.title, locales),
        description: buildTranslatable(values.description, item?.description, locales),
        ...(imageUrl ? { image: imageUrl } : {}),
      };
      const { data } = item
        ? await aboutApi.updateTimelineItem(item.id, payload)
        : await aboutApi.createTimelineItem(payload);
      toast.success(
        t(item ? "about.timeline.updateSuccess" : "about.timeline.createSuccess"),
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
      ? t(`about.timeline.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? "about.timeline.editItem" : "about.timeline.addItem")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FileUpload
          label={t("about.timeline.image")}
          value={imageUrl}
          onChange={setImageUrl}
          onUploadingChange={setIsUploadingImage}
        />

        <Input
          label={t("about.timeline.year")}
          error={fieldError(errors.year?.message)}
          {...register("year")}
        />
        <TranslatableFields
            locales={locales}
          fields={["title", "description"]}
          values={watchedValues}
          errors={errors}
        >
          {(locale) => (
            <>
              <Input
                label={`${t("about.timeline.itemTitle")} (${locale.toUpperCase()})`}
                error={fieldError(errors.title?.[locale]?.message)}
                {...register(`title.${locale}` as const)}
              />
              <Textarea
                label={`${t("about.timeline.description")} (${locale.toUpperCase()})`}
                error={fieldError(errors.description?.[locale]?.message)}
                {...register(`description.${locale}` as const)}
              />
            </>
          )}
        </TranslatableFields>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("about.timeline.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingImage}
          >
            {t(isEditing ? "about.timeline.save" : "about.timeline.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
