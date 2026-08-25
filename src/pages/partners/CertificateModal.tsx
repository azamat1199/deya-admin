import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { partnersApi } from "../../api/partners";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import type { Certificate } from "../../types/partners";

const translatableField = z
  .object({ ru: z.string(), uz: z.string(), en: z.string() })
  .refine((v) => Object.values(v).some((x) => x.trim()), {
    message: "titleRequired",
  });

const schema = z.object({
  title: translatableField,
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { title: { ru: "", uz: "", en: "" } };

export function CertificateModal({
  isOpen,
  onClose,
  certificate,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
  onSaved: (certificate: Certificate) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const isEditing = Boolean(certificate);

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
    if (certificate) {
      reset({ title: toTranslatable(certificate.title) });
    } else {
      reset(emptyValues);
    }
    setImageUrl(certificate?.image ?? null);
    setFileUrl(certificate?.file ?? null);
    setImageError(null);
    setFileError(null);
  }, [isOpen, certificate, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */
   

  const onSubmit = async (values: FormValues) => {
    let hasError = false;
    if (!imageUrl) {
      setImageError(t("partners.certificates.imageRequired"));
      hasError = true;
    }
    if (!fileUrl) {
      setFileError(t("partners.certificates.fileRequired"));
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: buildTranslatable(values.title, certificate?.title),
        image: imageUrl as string,
        file: fileUrl as string,
      };
      const { data } = certificate
        ? await partnersApi.updateCertificate(certificate.id, payload)
        : await partnersApi.createCertificate(payload);
      toast.success(
        t(
          certificate
            ? "partners.certificates.updateSuccess"
            : "partners.certificates.createSuccess",
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
      ? t(`partners.certificates.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(
        isEditing ? "partners.certificates.edit" : "partners.certificates.add",
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TranslatableFields fields={["title"]} values={watchedValues} errors={errors}>
          {(locale) => (
            <Input
              label={`${t("partners.certificates.certTitle")} (${locale.toUpperCase()})`}
              error={fieldError(errors.title?.[locale]?.message)}
              {...register(`title.${locale}` as const)}
            />
          )}
        </TranslatableFields>

        <FileUpload
          label={t("partners.certificates.image")}
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            if (url) setImageError(null);
          }}
          onUploadingChange={setIsUploadingImage}
          accept="image/*"
          error={imageError}
        />

        <FileUpload
          label={t("partners.certificates.file")}
          value={fileUrl}
          onChange={(url) => {
            setFileUrl(url);
            if (url) setFileError(null);
          }}
          onUploadingChange={setIsUploadingFile}
          accept=".pdf,.doc,.docx"
          error={fileError}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("partners.certificates.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingImage || isUploadingFile}
          >
            {t(
              isEditing
                ? "partners.certificates.save"
                : "partners.certificates.create",
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
