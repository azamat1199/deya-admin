import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { bannersApi } from "../../api/banners";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import type { Banner, PatchMainTextRequest } from "../../types/banners";

const schema = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
});

type FormValues = z.infer<typeof schema>;

const locales = localesFor("pages/banners");

export function MainTextModal({
  isOpen,
  onClose,
  record,
  labelKey,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  record: Banner | null;
  labelKey: string;
  onSaved: (banner: Banner) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ru: "", uz: "", en: "" },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      ru: toTranslatable(record?.title).ru,
      uz: toTranslatable(record?.subtitle).uz,
      en: toTranslatable(record?.cta_label).en,
    });
  }, [isOpen, record, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!record) return;
    setIsSubmitting(true);
    try {
      const payload: PatchMainTextRequest = {
        title: buildTranslatable(
          { ru: values.ru, uz: "", en: "" },
          null,
          locales,
        ),
        subtitle: buildTranslatable(
          { ru: "", uz: values.uz, en: "" },
          null,
          locales,
        ),
        cta_label: buildTranslatable(
          { ru: "", uz: "", en: values.en },
          null,
          locales,
        ),
      };
      const { data } = await bannersApi.patchBanner(record.id, payload);
      toast.success(t("pages.mainText.updateSuccess"));
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
      ? t(`pages.mainText.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(labelKey)}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Textarea
          label={t("pages.mainText.langRu")}
          rows={3}
          error={fieldError(errors.ru?.message)}
          {...register("ru")}
        />
        <Textarea
          label={t("pages.mainText.langUz")}
          rows={3}
          error={fieldError(errors.uz?.message)}
          {...register("uz")}
        />
        <Textarea
          label={t("pages.mainText.langEn")}
          rows={3}
          error={fieldError(errors.en?.message)}
          {...register("en")}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("pages.mainText.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t("pages.mainText.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
