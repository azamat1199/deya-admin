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
import { careersApi } from "../../api/careers";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import type { CareerValue } from "../../types/careers";

const schema = z.object({
  title: z.string().min(1, "titleRequired"),
  text: z.string().min(1, "textRequired"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { title: "", text: "" };

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
    if (value) {
      reset({ title: value.title, text: value.text });
    } else {
      reset(emptyValues);
    }
    setImageUrl(value?.image ?? null);
  }, [isOpen, value, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title,
        text: values.text,
        ...(imageUrl ? { image: imageUrl } : {}),
      };
      const { data } = value
        ? await careersApi.updateCareerValue(value.id, payload)
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
        <Input
          label={t("careers.careerValues.valueTitle")}
          error={fieldError(errors.title?.message)}
          {...register("title")}
        />

        <Textarea
          label={t("careers.careerValues.text")}
          error={fieldError(errors.text?.message)}
          {...register("text")}
        />

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
            {t(isEditing ? "careers.careerValues.save" : "careers.careerValues.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
