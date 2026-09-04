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
import { careersApi } from "../../api/careers";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import type { CareerValue, CareerValuePayload } from "../../types/careers";

// Same convention as every other translatable form: at least one locale
// must be filled, not a specific one — matching TimelineModal/CompanyModal/etc.
const translatableField = z.object({ ru: z.string(), uz: z.string(), en: z.string() });
const requiredTranslatable = (message: string) =>
  translatableField.refine((v) => Object.values(v).some((x) => x.trim()), {
    message,
  });

const schema = z.object({
  title: requiredTranslatable("titleRequired"),
  text: requiredTranslatable("textRequired"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  title: { ru: "", uz: "", en: "" },
  text: { ru: "", uz: "", en: "" },
};

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor("careers/career-values");

export function CareerValueModal({
  isOpen,
  onClose,
  value,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: CareerValue | null;
  onSaved: (value: CareerValue) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isEditing = Boolean(value);

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
    if (value) {
      // Full objects — resolving to one string here would wipe the other
      // languages on the next save.
      reset({
        title: toTranslatable(value.title),
        text: toTranslatable(value.text),
      });
    } else {
      reset(emptyValues);
    }
    setImageUrl(value?.image ?? null);
  }, [isOpen, value, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Always the full locale key set, like every other form — a partial
      // object breaks any serializer that requires an exact language set.
      // On edit, a blank box keeps the stored translation rather than
      // blanking it; on create it sends "".
      const payload: CareerValuePayload = {
        title: buildTranslatable(values.title, value?.title, locales),
        text: buildTranslatable(values.text, value?.text, locales),
        ...(imageUrl ? { image: imageUrl } : {}),
      };
      // PATCH on edit so untouched server-side fields are left alone.
      const { data } = value
        ? await careersApi.patchCareerValue(value.id, payload)
        : await careersApi.createCareerValue(payload);
      toast.success(
        t(
          value
            ? "careers.careerValues.updateSuccess"
            : "careers.careerValues.createSuccess",
        ),
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
      ? t(`careers.careerValues.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(
        isEditing
          ? "careers.careerValues.editValue"
          : "careers.careerValues.addValue",
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TranslatableFields
          locales={locales}
          fields={["title", "text"]}
          values={watchedValues}
          errors={errors}
        >
          {(locale) => (
            <>
              <Input
                label={`${t("careers.careerValues.valueTitle")} (${locale.toUpperCase()})`}
                error={fieldError(errors.title?.[locale]?.message)}
                {...register(`title.${locale}` as const)}
              />
              <Textarea
                label={`${t("careers.careerValues.text")} (${locale.toUpperCase()})`}
                error={fieldError(errors.text?.[locale]?.message)}
                {...register(`text.${locale}` as const)}
              />
            </>
          )}
        </TranslatableFields>

        <FileUpload
          label={`${t("careers.careerValues.image")} (${t(
            "careers.careerValues.optional",
          )})`}
          value={imageUrl}
          onChange={setImageUrl}
          onUploadingChange={setIsUploadingImage}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("careers.careerValues.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingImage}
          >
            {t(
              isEditing
                ? "careers.careerValues.save"
                : "careers.careerValues.create",
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
