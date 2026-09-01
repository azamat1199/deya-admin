import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { pagesApi } from "../../api/pages";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import type { SiteSettings, SiteSettingsPayload } from "../../types/pages";

const PHONE_REGEX = /^\+?[0-9\s-]{7,20}$/;

const translatableField = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
});

const schema = z.object({
  phone: z.string().regex(PHONE_REGEX, "phoneInvalid"),
  hotline: z.string().regex(PHONE_REGEX, "hotlineInvalid"),
  email: z.string().email("emailInvalid"),
  address: translatableField,
  work_hours: translatableField,
  yandex_map_url: z.string().url("urlInvalid").or(z.literal("")),
  instagram_url: z.string().url("urlInvalid").or(z.literal("")),
  telegram_url: z.string().url("urlInvalid").or(z.literal("")),
  cookie_notice_text: translatableField,
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  phone: "",
  hotline: "",
  email: "",
  address: { ru: "", uz: "", en: "" },
  work_hours: { ru: "", uz: "", en: "" },
  yandex_map_url: "",
  instagram_url: "",
  telegram_url: "",
  cookie_notice_text: { ru: "", uz: "", en: "" },
};

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-9 w-full animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
    </div>
  );
}

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor("pages/settings");

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogFileUrl, setCatalogFileUrl] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  // settings/ is PUT-only (no PATCH), so every save rewrites the whole
  // object. The loaded record is kept so untouched languages are sent back
  // as-is rather than blanked.
  const [loaded, setLoaded] = useState<SiteSettings | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  // useWatch instead of watch(): watch() is not memo-safe and makes
  // React Compiler bail out of optimizing the whole component.
  const watchedValues = useWatch({ control });

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const { data } = await pagesApi.getSettings();
      reset({
        phone: data.phone,
        hotline: data.hotline,
        email: data.email,
        address: toTranslatable(data.address),
        work_hours: toTranslatable(data.work_hours),
        yandex_map_url: data.yandex_map_url,
        instagram_url: data.instagram_url,
        telegram_url: data.telegram_url,
        cookie_notice_text: toTranslatable(data.cookie_notice_text),
      });
      setCatalogFileUrl(data.catalog_file || null);
      setLoaded(data);
      setUpdatedAt(data.updated_at);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

   
  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  /* eslint-enable react-hooks/set-state-in-effect */
   

  useUnsavedChangesGuard(isDirty);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: SiteSettingsPayload = {
        ...values,
        address: buildTranslatable(values.address, loaded?.address, locales),
        work_hours: buildTranslatable(values.work_hours, loaded?.work_hours, locales),
        cookie_notice_text: buildTranslatable(
          values.cookie_notice_text,
          loaded?.cookie_notice_text,
          locales,
        ),
        catalog_file: catalogFileUrl ?? "",
      };
      const { data } = await pagesApi.updateSettings(payload);
      toast.success(t("pages.settings.updateSuccess"));
      reset(values);
      setUpdatedAt(data.updated_at);
    } catch (error) {
      applyApiFieldErrors<FormValues>(error, setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message
      ? t(`pages.settings.${message}`, { defaultValue: message })
      : undefined;

  if (hasError) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("pages.settings.title")}
        </h2>
        <Card className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-red-600">{t("pages.settings.loadError")}</p>
          <Button variant="secondary" onClick={fetchSettings}>
            {t("pages.settings.retry")}
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("pages.settings.title")}
        </h2>
        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex flex-col gap-4 p-6">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <FieldSkeleton />
              <FieldSkeleton />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        {t("pages.settings.title")}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("pages.settings.sectionContact")}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("pages.settings.phone")}
              type="tel"
              error={fieldError(errors.phone?.message)}
              {...register("phone")}
            />
            <Input
              label={t("pages.settings.hotline")}
              type="tel"
              error={fieldError(errors.hotline?.message)}
              {...register("hotline")}
            />
            <Input
              label={t("pages.settings.email")}
              type="email"
              error={fieldError(errors.email?.message)}
              {...register("email")}
            />
          </div>

          <TranslatableFields
            locales={locales}
            fields={["address", "work_hours"]}
            values={watchedValues}
            errors={errors}
          >
            {(locale) => (
              <>
                <Input
                  label={`${t("pages.settings.workHours")} (${locale.toUpperCase()})`}
                  error={fieldError(errors.work_hours?.[locale]?.message)}
                  {...register(`work_hours.${locale}` as const)}
                />
                <Input
                  label={`${t("pages.settings.address")} (${locale.toUpperCase()})`}
                  error={fieldError(errors.address?.[locale]?.message)}
                  {...register(`address.${locale}` as const)}
                />
              </>
            )}
          </TranslatableFields>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("pages.settings.sectionLinks")}
          </h3>

          <Input
            label={t("pages.settings.yandexMapUrl")}
            placeholder="https://"
            error={fieldError(errors.yandex_map_url?.message)}
            {...register("yandex_map_url")}
          />
          <Input
            label={t("pages.settings.instagramUrl")}
            placeholder="https://"
            error={fieldError(errors.instagram_url?.message)}
            {...register("instagram_url")}
          />
          <Input
            label={t("pages.settings.telegramUrl")}
            placeholder="https://"
            error={fieldError(errors.telegram_url?.message)}
            {...register("telegram_url")}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("pages.settings.sectionFiles")}
          </h3>

          <FileUpload
            label={t("pages.settings.catalogFile")}
            value={catalogFileUrl}
            onChange={setCatalogFileUrl}
            onUploadingChange={setIsUploadingFile}
            accept=".pdf"
          />
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("pages.settings.sectionLegal")}
          </h3>

          <TranslatableFields
            locales={locales}
            fields={["cookie_notice_text"]}
            values={watchedValues}
            errors={errors}
          >
            {(locale) => (
              <Textarea
                label={`${t("pages.settings.cookieNoticeText")} (${locale.toUpperCase()})`}
                error={fieldError(errors.cookie_notice_text?.[locale]?.message)}
                {...register(`cookie_notice_text.${locale}` as const)}
              />
            )}
          </TranslatableFields>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {updatedAt &&
              t("pages.settings.lastUpdated", {
                date: new Date(updatedAt).toLocaleString(i18n.language),
              })}
          </span>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingFile}
          >
            {t("pages.settings.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
