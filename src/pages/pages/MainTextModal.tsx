import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { bannersApi } from "../../api/banners";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import type { Banner, PatchMainTextRequest } from "../../types/banners";

const translatableField = z.object({ ru: z.string(), uz: z.string(), en: z.string() });

// All four are plain — no field is required to be non-empty client-side;
// the backend's own validation (exact three keys) is what buildTranslatable
// already satisfies. Not requiring any one of them avoids blocking a save
// on a field this admin can't otherwise tell is meant to be optional.
const schema = z.object({
  created_fabric: translatableField,
  starts_fabric: translatableField,
  tech_fabric: translatableField,
  export_text: translatableField,
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  created_fabric: { ru: "", uz: "", en: "" },
  starts_fabric: { ru: "", uz: "", en: "" },
  tech_fabric: { ru: "", uz: "", en: "" },
  export_text: { ru: "", uz: "", en: "" },
};

/** Same endpoint as the ordinary banner form (pages/banners) — this is a
    field-set variant of the same resource, not a separate one. */
const locales = localesFor("pages/banners");

export function MainTextModal({
  isOpen,
  onClose,
  banner,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  banner: Banner | null;
  onSaved: (banner: Banner) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (!isOpen) return;
    // Full objects — resolving to one string here would wipe the other
    // two languages on the next save.
    reset({
      created_fabric: toTranslatable(banner?.created_fabric),
      starts_fabric: toTranslatable(banner?.starts_fabric),
      tech_fabric: toTranslatable(banner?.tech_fabric),
      export_text: toTranslatable(banner?.export_text),
    });
  }, [isOpen, banner, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!banner) return;
    setIsSubmitting(true);
    try {
      // Exactly these four keys — never title/subtitle/image/cta_label/
      // cta_url/type. PATCH, id in the path, never PUT.
      const payload: PatchMainTextRequest = {
        created_fabric: buildTranslatable(
          values.created_fabric,
          banner.created_fabric,
          locales,
        ),
        starts_fabric: buildTranslatable(
          values.starts_fabric,
          banner.starts_fabric,
          locales,
        ),
        tech_fabric: buildTranslatable(
          values.tech_fabric,
          banner.tech_fabric,
          locales,
        ),
        export_text: buildTranslatable(
          values.export_text,
          banner.export_text,
          locales,
        ),
      };
      const { data } = await bannersApi.patchBanner(banner.id, payload);
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
    message ? t(`pages.mainText.${message}`, { defaultValue: message }) : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("pages.mainText.editTitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TranslatableFields
          locales={locales}
          fields={["created_fabric", "starts_fabric", "tech_fabric", "export_text"]}
          values={watchedValues}
          errors={errors}
        >
          {(locale) => (
            <>
              <Input
                label={`${t("pages.mainText.createdFabric")} (${locale.toUpperCase()})`}
                error={fieldError(errors.created_fabric?.[locale]?.message)}
                {...register(`created_fabric.${locale}` as const)}
              />
              <Input
                label={`${t("pages.mainText.startsFabric")} (${locale.toUpperCase()})`}
                error={fieldError(errors.starts_fabric?.[locale]?.message)}
                {...register(`starts_fabric.${locale}` as const)}
              />
              <Input
                label={`${t("pages.mainText.techFabric")} (${locale.toUpperCase()})`}
                error={fieldError(errors.tech_fabric?.[locale]?.message)}
                {...register(`tech_fabric.${locale}` as const)}
              />
              <Input
                label={`${t("pages.mainText.exportText")} (${locale.toUpperCase()})`}
                error={fieldError(errors.export_text?.[locale]?.message)}
                {...register(`export_text.${locale}` as const)}
              />
            </>
          )}
        </TranslatableFields>

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
