import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { toLocalizedText } from "../../utils/localized";
import type { TimelineItem } from "../../types/about";

const schema = z.object({
  year: z.string().regex(/^\d{4}$/, "yearInvalid"),
  title: z.string().min(1, "titleRequired"),
  description: z.string().min(1, "descriptionRequired"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  year: String(new Date().getFullYear()),
  title: "",
  description: "",
};

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
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isEditing = Boolean(item);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      const title = toLocalizedText(item.title);
      const description = toLocalizedText(item.description);
      const lang = i18n.language === "ru" ? "ru" : "uz";
      reset({
        year: String(item.year),
        title: title[lang] || title.uz || title.ru,
        description: description[lang] || description.uz || description.ru,
      });
    } else {
      reset(emptyValues);
    }
    setImageUrl(item?.image ?? null);
  }, [isOpen, item, reset, i18n.language]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Swagger's confirmed request body takes plain strings, so editing
      // an item whose title/description came back as {uz, ru} collapses it
      // to a single language on save — single-language form is one field.
      const payload = {
        year: Number(values.year),
        title: values.title,
        description: values.description,
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
        <Input
          label={t("about.timeline.itemTitle")}
          error={fieldError(errors.title?.message)}
          {...register("title")}
        />
        <Textarea
          label={t("about.timeline.description")}
          error={fieldError(errors.description?.message)}
          {...register("description")}
        />

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
