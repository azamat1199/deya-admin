import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { careersApi } from "../../api/careers";
import { getApiErrorMessage } from "../../api/client";
import {
  LOCALES,
  buildTranslatable,
  toTranslatable,
  type Locale,
} from "../../api/i18n";
import { localesFor } from "../../api/locale-support";

const DEFAULT_LOCALE: Locale = "ru";
import type { CareerValue, PatchCareerValueRequest } from "../../types/careers";

// Every locale is optional except the app's default (uz), which must be
// present so a record always renders something in the default admin view.
// The backend may enforce more; those come back as 400s and are mapped onto
// the matching input below.
const localizedField = (requiredMessage: string) =>
  z.object({
    uz: z.string().min(1, requiredMessage),
    ru: z.string(),
    en: z.string(),
  });

const schema = z.object({
  title: localizedField("titleRequired"),
  text: localizedField("textRequired"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  title: { uz: "", ru: "", en: "" },
  text: { uz: "", ru: "", en: "" },
};

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor("careers/career-values");

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
  const [activeLocale, setActiveLocale] = useState<Locale>(DEFAULT_LOCALE);
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
      reset({
        title: toTranslatable(value.title),
        text: toTranslatable(value.text),
      });
    } else {
      reset(emptyValues);
    }
    setImageUrl(value?.image ?? null);
    setActiveLocale(DEFAULT_LOCALE);
  }, [isOpen, value, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Always the full { uz, ru, en } key set, like the other forms —
      // a partial object breaks any serializer that requires an exact
      // language set. On edit, a blank box keeps the stored translation
      // rather than blanking it; on create it sends "".
      const payload: PatchCareerValueRequest = {
        title: buildTranslatable(values.title, value?.title, locales),
        text: buildTranslatable(values.text, value?.text, locales),
        ...(imageUrl ? { image: imageUrl } : {}),
      };
      // PATCH on edit so untouched server-side fields are left alone.
      const { data } = value
        ? await careersApi.patchCareerValue(value.id, payload)
        : await careersApi.createCareerValue(
            payload as Required<PatchCareerValueRequest>,
          );
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
      applyNestedFieldErrors(error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * DRF reports errors on translatable fields either flattened
   * ("title.uz": [...]) or nested ({ title: { uz: [...] } }). The shared
   * applyApiFieldErrors only handles the top level, so both forms are
   * unwrapped here onto the matching per-locale input.
   */
  const applyNestedFieldErrors = (error: unknown) => {
    const data = (
      error as { response?: { data?: Record<string, unknown> } } | undefined
    )?.response?.data;
    if (!data || typeof data !== "object") return;

    const firstMessage = (v: unknown): string =>
      Array.isArray(v) ? String(v[0]) : String(v);

    for (const [key, val] of Object.entries(data)) {
      if (key === "detail") continue;

      if (key.includes(".")) {
        const [field, loc] = key.split(".");
        if (isFormField(field) && isLocale(loc)) {
          setError(`${field}.${loc}` as const, {
            type: "server",
            message: firstMessage(val),
          });
        }
        continue;
      }

      if (isFormField(key) && val && typeof val === "object" && !Array.isArray(val)) {
        for (const [loc, msg] of Object.entries(val as Record<string, unknown>)) {
          if (isLocale(loc)) {
            setError(`${key}.${loc}` as const, {
              type: "server",
              message: firstMessage(msg),
            });
          }
        }
      }
    }
  };

  const fieldError = (message: string | undefined) =>
    message
      ? t(`careers.careerValues.${message}`, { defaultValue: message })
      : undefined;

  /** True when a locale tab holds an error, so it can be flagged. */
  const localeHasError = (loc: Locale) =>
    Boolean(errors.title?.[loc] || errors.text?.[loc]);

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
        <div
          role="tablist"
          className="flex gap-1 border-b border-slate-200 dark:border-slate-800"
        >
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              role="tab"
              aria-selected={activeLocale === loc}
              onClick={() => setActiveLocale(loc)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeLocale === loc
                  ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {loc.toUpperCase()}
              {loc === DEFAULT_LOCALE && (
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              )}
              {localeHasError(loc) && (
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* All locales stay mounted so react-hook-form keeps their values and
            validation errors; only the active one is visible. */}
        {locales.map((loc) => (
          <div
            key={loc}
            hidden={loc !== activeLocale}
            className="flex flex-col gap-4"
          >
            <Input
              label={`${t("careers.careerValues.valueTitle")} (${loc.toUpperCase()})`}
              error={fieldError(errors.title?.[loc]?.message)}
              {...register(`title.${loc}` as const)}
            />
            <Textarea
              label={`${t("careers.careerValues.text")} (${loc.toUpperCase()})`}
              error={fieldError(errors.text?.[loc]?.message)}
              {...register(`text.${loc}` as const)}
            />
          </div>
        ))}

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
            {t(
              isEditing
                ? "careers.careerValues.save"
                : "careers.careerValues.create",
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

function isFormField(v: string): v is "title" | "text" {
  return v === "title" || v === "text";
}
