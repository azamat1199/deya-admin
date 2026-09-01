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
import { localesFor } from "../../api/locale-support";
import type { Partner } from "../../types/partners";

const translatableField = z
  .object({ ru: z.string(), uz: z.string(), en: z.string() })
  .refine((v) => Object.values(v).some((x) => x.trim()), {
    message: "nameRequired",
  });

const schema = z.object({
  name: translatableField,
  website: z.string().url("websiteInvalid").or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { name: { ru: "", uz: "", en: "" }, website: "" };

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor("partners/partners");

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
    if (partner) {
      reset({ name: toTranslatable(partner.name), website: partner.website });
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
        name: buildTranslatable(values.name, partner?.name, locales),
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
        <TranslatableFields locales={locales} fields={["name"]} values={watchedValues} errors={errors}>
          {(locale) => (
            <Input
              label={`${t("partners.partners.name")} (${locale.toUpperCase()})`}
              error={fieldError(errors.name?.[locale]?.message)}
              {...register(`name.${locale}` as const)}
            />
          )}
        </TranslatableFields>

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
