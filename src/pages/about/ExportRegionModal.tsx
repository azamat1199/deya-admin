import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { aboutApi } from "../../api/about";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import type { ExportRegion } from "../../types/about";

const translatableField = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
});

const schema = z.object({
  name: translatableField.refine((v) => Object.values(v).some((x) => x.trim()), {
    message: "nameRequired",
  }),
  position_x: z.string().min(1, "positionRequired"),
  position_y: z.string().min(1, "positionRequired"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  name: { ru: "", uz: "", en: "" },
  position_x: "",
  position_y: "",
};

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor("about/export-regions");

export function ExportRegionModal({
  isOpen,
  onClose,
  region,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  region: ExportRegion | null;
  onSaved: (region: ExportRegion) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(region);

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
    if (isOpen) {
      reset(
        region
          ? {
              name: toTranslatable(region.name),
              position_x: region.position_x,
              position_y: region.position_y,
            }
          : emptyValues,
      );
    }
  }, [isOpen, region, reset]);

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: buildTranslatable(values.name, region?.name, locales),
        position_x: values.position_x,
        position_y: values.position_y,
      };
      const { data } = region
        ? await aboutApi.updateExportRegion(region.id, payload)
        : await aboutApi.createExportRegion(payload);
      toast.success(
        t(
          region
            ? "about.exportRegions.updateSuccess"
            : "about.exportRegions.createSuccess",
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
      ? t(`about.exportRegions.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t(
        isEditing
          ? "about.exportRegions.editRegion"
          : "about.exportRegions.addRegion",
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TranslatableFields locales={locales} fields={["name"]} values={watchedValues} errors={errors}>
          {(locale) => (
            <Input
              label={`${t("about.exportRegions.name")} (${locale.toUpperCase()})`}
              error={fieldError(errors.name?.[locale]?.message)}
              {...register(`name.${locale}` as const)}
            />
          )}
        </TranslatableFields>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("about.exportRegions.positionX")}
            error={fieldError(errors.position_x?.message)}
            {...register("position_x")}
          />
          <Input
            label={t("about.exportRegions.positionY")}
            error={fieldError(errors.position_y?.message)}
            {...register("position_y")}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t("about.exportRegions.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t(
              isEditing
                ? "about.exportRegions.save"
                : "about.exportRegions.create",
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
