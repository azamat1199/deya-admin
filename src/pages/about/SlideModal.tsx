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
import { aboutApi } from "../../api/about";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import type { Slide } from "../../types/about";

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
  title: requiredTranslatable("titleRequired"),
  description: requiredTranslatable("descriptionRequired"),
  order: z.string().regex(/^\d+$/, "orderInvalid"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  title: { ru: "", uz: "", en: "" },
  description: { ru: "", uz: "", en: "" },
  order: "0",
};

export function SlideModal({
  isOpen,
  onClose,
  slide,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  slide: Slide | null;
  onSaved: (slide: Slide) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const isEditing = Boolean(slide);

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
    if (slide) {
      reset({
        title: toTranslatable(slide.title),
        description: toTranslatable(slide.description),
        order: String(slide.order),
      });
    } else {
      reset(emptyValues);
    }
    setIsActive(slide?.is_active ?? true);
    setImageUrl(slide?.image ?? null);
    setImageError(null);
  }, [isOpen, slide, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */
   

  const onSubmit = async (values: FormValues) => {
    if (!imageUrl) {
      setImageError(t("about.slides.imageRequired"));
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: buildTranslatable(values.title, slide?.title),
        description: buildTranslatable(values.description, slide?.description),
        order: Number(values.order),
        is_active: isActive,
        image: imageUrl,
      };
      const { data } = slide
        ? await aboutApi.updateSlide(slide.id, payload)
        : await aboutApi.createSlide(payload);
      toast.success(
        t(slide ? "about.slides.updateSuccess" : "about.slides.createSuccess"),
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
      ? t(`about.slides.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? "about.slides.editSlide" : "about.slides.addSlide")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FileUpload
          label={t("about.slides.image")}
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            if (url) setImageError(null);
          }}
          onUploadingChange={setIsUploadingImage}
          error={imageError}
        />

        <TranslatableFields
          fields={["title", "description"]}
          values={watchedValues}
          errors={errors}
        >
          {(locale) => (
            <>
              <Input
                label={`${t("about.slides.slideTitle")} (${locale.toUpperCase()})`}
                error={fieldError(errors.title?.[locale]?.message)}
                {...register(`title.${locale}` as const)}
              />
              <Input
                label={`${t("about.slides.description")} (${locale.toUpperCase()})`}
                error={fieldError(errors.description?.[locale]?.message)}
                {...register(`description.${locale}` as const)}
              />
            </>
          )}
        </TranslatableFields>

        <Input
          label={t("about.slides.order")}
          type="number"
          min={0}
          error={fieldError(errors.order?.message)}
          {...register("order")}
        />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("about.slides.status")}
          </span>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            aria-label={t("about.slides.status")}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("about.slides.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingImage}
          >
            {t(isEditing ? "about.slides.save" : "about.slides.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
