import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { aboutApi } from "../../api/about";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { toLocalizedText } from "../../utils/localized";
import type { Stat } from "../../types/about";

const schema = z.object({
  title_uz: z.string().min(1, "titleRequired"),
  title_ru: z.string().min(1, "titleRequired"),
  value: z.string().min(1, "valueRequired"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { title_uz: "", title_ru: "", value: "" };

export function StatModal({
  isOpen,
  onClose,
  stat,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  stat: Stat | null;
  onSaved: (stat: Stat) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const isEditing = Boolean(stat);

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
    if (stat) {
      const title = toLocalizedText(stat.title);
      reset({ title_uz: title.uz, title_ru: title.ru, value: stat.value });
    } else {
      reset(emptyValues);
    }
    setIsActive(stat?.is_active ?? true);
  }, [isOpen, stat, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: { uz: values.title_uz, ru: values.title_ru },
        value: values.value,
        is_active: isActive,
      };
      const { data } = stat
        ? await aboutApi.updateStat(stat.id, payload)
        : await aboutApi.createStat(payload);
      toast.success(
        t(stat ? "about.stats.updateSuccess" : "about.stats.createSuccess"),
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
      ? t(`about.stats.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? "about.stats.editStat" : "about.stats.addStat")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`${t("about.stats.statTitle")} (UZ)`}
            error={fieldError(errors.title_uz?.message)}
            {...register("title_uz")}
          />
          <Input
            label={`${t("about.stats.statTitle")} (RU)`}
            error={fieldError(errors.title_ru?.message)}
            {...register("title_ru")}
          />
        </div>

        <Input
          label={t("about.stats.value")}
          error={fieldError(errors.value?.message)}
          {...register("value")}
        />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("about.stats.status")}
          </span>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            aria-label={t("about.stats.status")}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("about.stats.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t(isEditing ? "about.stats.save" : "about.stats.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
