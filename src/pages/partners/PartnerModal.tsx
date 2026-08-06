import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { partnersApi } from "../../api/partners";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import type { Partner } from "../../types/partners";

const schema = z.object({
  name: z.string().min(1, "nameRequired"),
  website: z.string().url("websiteInvalid").or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { name: "", website: "" };

export function PartnerModal({
  isOpen,
  onClose,
  partner,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  onSaved: (partner: Partner) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const isEditing = Boolean(partner);

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
    if (partner) {
      reset({ name: partner.name, website: partner.website });
    } else {
      reset(emptyValues);
    }
    setLogoUrl(partner?.logo ?? null);
  }, [isOpen, partner, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        website: values.website,
        ...(logoUrl ? { logo: logoUrl } : {}),
      };
      const { data } = partner
        ? await partnersApi.updatePartner(partner.id, payload)
        : await partnersApi.createPartner(payload);
      toast.success(
        t(partner ? "partners.partners.updateSuccess" : "partners.partners.createSuccess"),
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
      ? t(`partners.partners.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? "partners.partners.edit" : "partners.partners.add")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label={t("partners.partners.name")}
          error={fieldError(errors.name?.message)}
          {...register("name")}
        />

        <FileUpload
          label={`${t("partners.partners.logo")} (${t("partners.partners.optional")})`}
          value={logoUrl}
          onChange={setLogoUrl}
          onUploadingChange={setIsUploadingLogo}
          accept="image/*"
        />

        <Input
          label={t("partners.partners.website")}
          placeholder="https://"
          error={fieldError(errors.website?.message)}
          {...register("website")}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("partners.partners.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingLogo}
          >
            {t(isEditing ? "partners.partners.save" : "partners.partners.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
