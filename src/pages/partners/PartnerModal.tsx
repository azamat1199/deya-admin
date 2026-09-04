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
import type { Partner, PartnerPayload, PatchPartnerRequest } from "../../types/partners";

// Plain scalars only — partners has no translatable field, so this form
// carries no RU/UZ/EN tabs at all.
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
  // Only send `logo` when the user actually changed it: re-sending the
  // stored URL unconditionally is the bug that hit CompanyModal, and
  // omitting the field silently on removal (rather than sending null) meant
  // "remove logo" never reached the server at all.
  const [logoDirty, setLogoDirty] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
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
    setLogoDirty(false);
    setLogoError(null);
  }, [isOpen, partner, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    // Required by the schema on create; on edit an untouched logo is simply
    // not re-validated here (the stored one stands).
    if (!isEditing && !logoUrl) {
      setLogoError(t("partners.partners.logoRequired"));
      return;
    }
    setLogoError(null);
    setIsSubmitting(true);
    try {
      const { data } = partner
        ? await partnersApi.patchPartner(partner.id, {
            name: values.name,
            website: values.website,
            // Omit when untouched; explicit null when the user removed it.
            ...(logoDirty ? { logo: logoUrl } : {}),
          } satisfies PatchPartnerRequest)
        : await partnersApi.createPartner({
            name: values.name,
            website: values.website,
            logo: logoUrl as string,
          } satisfies PartnerPayload);
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
          label={t("partners.partners.logo")}
          value={logoUrl}
          onChange={(url) => {
            setLogoUrl(url);
            setLogoDirty(true);
            if (logoError) setLogoError(null);
          }}
          onUploadingChange={setIsUploadingLogo}
          accept="image/*"
          error={logoError}
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
