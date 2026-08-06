import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { catalogApi } from "../../api/catalog";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { WEIGHT_UNITS } from "../../types/catalog";
import type { Weight } from "../../types/catalog";

const schema = z.object({
  // Decimal, kept as a string end-to-end (never coerced to number) so we
  // don't touch the backend's own precision/formatting. Positive-only —
  // loosen this if the backend genuinely needs negative values.
  value: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "valueInvalid")
    .refine((v) => Number(v) > 0, "valueInvalid"),
  unit: z.string().min(1, "unitRequired"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { value: "", unit: "g" };

export function WeightModal({
  isOpen,
  onClose,
  weight,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  weight: Weight | null;
  onSaved: (weight: Weight) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(weight);

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

  const unitOptions = (() => {
    const values = new Set<string>(WEIGHT_UNITS);
    if (weight?.unit) values.add(weight.unit);
    return Array.from(values).map((value) => ({
      value,
      label: t(`catalog.weights.unit_${value}`, { defaultValue: value }),
    }));
  })();

  useEffect(() => {
    if (!isOpen) return;
    if (weight) {
      reset({ value: weight.value, unit: weight.unit });
    } else {
      reset(emptyValues);
    }
  }, [isOpen, weight, reset]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = { value: values.value, unit: values.unit };
      const { data } = weight
        ? await catalogApi.updateWeight(weight.id, payload)
        : await catalogApi.createWeight(payload);
      toast.success(
        t(weight ? "catalog.weights.updateSuccess" : "catalog.weights.createSuccess"),
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
      ? t(`catalog.weights.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? "catalog.weights.edit" : "catalog.weights.add")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label={t("catalog.weights.value")}
          type="number"
          step="any"
          min={0}
          error={fieldError(errors.value?.message)}
          {...register("value")}
        />

        <Select
          label={t("catalog.weights.unit")}
          options={unitOptions}
          error={fieldError(errors.unit?.message)}
          {...register("unit")}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("catalog.weights.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t(isEditing ? "catalog.weights.save" : "catalog.weights.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
