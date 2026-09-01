import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { FileUpload } from "../../components/FileUpload";
import { aboutApi } from "../../api/about";
import { getApiErrorMessage } from "../../api/client";
import {
  LOCALES,
  buildTranslatable,
  parseAllowedLocales,
  toTranslatable,
  type Locale,
  type Translatable,
} from "../../api/i18n";
import { localesFor, reportLocaleMismatch } from "../../api/locale-support";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import type { Factory as FactoryRecord, PatchFactoryRequest } from "../../types/about";

// Shape follows LOCALES: `satisfies` stops compiling if a locale is added to
// LOCALES without being added here, so the form can't silently drift.
const translatableSchema = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
}) satisfies z.ZodType<Record<Locale, string>>;

// Only the plain-text fields go through react-hook-form; the two rich-text
// fields can't be registered and live in their own state below.
const schema = z.object({
  title: translatableSchema,
  description: translatableSchema,
});

type FormValues = z.infer<typeof schema>;

/** Rich-text fields, kept together so the tab markers can see all four. */
const RICH_FIELDS = ["subtitle", "subdescription"] as const;
type RichField = (typeof RICH_FIELDS)[number];

/** Built from LOCALES rather than a hardcoded literal. */
const emptyTranslatable = (): Translatable =>
  Object.fromEntries(LOCALES.map((l) => [l, ""])) as Translatable;

/** This screen's entry in the per-endpoint locale map. */
const LOCALE_KEY = "about/factory";

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor(LOCALE_KEY);

export default function Factory() {
  const { t, i18n } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaded, setLoaded] = useState<FactoryRecord | null>(null);

  const [rich, setRich] = useState<Record<RichField, Translatable>>(() => ({
    subtitle: emptyTranslatable(),
    subdescription: emptyTranslatable(),
  }));
  const [richDirty, setRichDirty] = useState(false);
  const [richErrors, setRichErrors] = useState<
    Record<RichField, Partial<Record<Locale, string>>>
  >({ subtitle: {}, subdescription: {} });

  // One shared photo for every locale, so it sits outside the tabs.
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDirty, setImageDirty] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Set when the API refuses our key set ("...exactly these languages: ru, en.").
  // Carries the server's own wording so a changed constraint is readable
  // verbatim rather than paraphrased into something misleading.
  const [localeRefusal, setLocaleRefusal] = useState<{
    accepted: string[];
    serverMessage: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: emptyTranslatable() as FormValues["title"],
      description: emptyTranslatable() as FormValues["description"],
    },
  });

  // useWatch rather than watch(): watch() is not memo-safe and makes React
  // Compiler bail out of optimizing the component.
  const watchedValues = useWatch({ control });

  useUnsavedChangesGuard(isDirty || richDirty || imageDirty);

  const applyRecord = useCallback(
    (data: FactoryRecord) => {
      // Full objects into state — never resolve to one string on load, or the
      // next save wipes the other locales.
      reset({
        title: toTranslatable(data.title) as FormValues["title"],
        description: toTranslatable(data.description) as FormValues["description"],
      });
      setRich({
        subtitle: toTranslatable(data.subtitle),
        subdescription: toTranslatable(data.subdescription),
      });
      setImageUrl(data.image || null);
      setRichDirty(false);
      setImageDirty(false);
      setLoaded(data);
    },
    [reset],
  );

  const fetchFactory = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const { data } = await aboutApi.getFactory();
      applyRecord(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [applyRecord]);

  /* eslint-disable react-hooks/set-state-in-effect -- loads the singleton on
     mount; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    fetchFactory();
  }, [fetchFactory]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isRichField = (v: string): v is RichField =>
    (RICH_FIELDS as readonly string[]).includes(v);

  /**
   * Maps a DRF 400 onto the matching input. Handles both the flattened
   * ("subtitle.ru") and nested ({ subtitle: { ru: [...] } }) forms, and
   * recovers the accepted locale list from an exact-key-set refusal.
   */
  const applyServerErrors = (error: unknown): void => {
    const data = (
      error as { response?: { data?: Record<string, unknown> } } | undefined
    )?.response?.data;
    if (!data || typeof data !== "object") return;

    const firstMessage = (v: unknown): string =>
      Array.isArray(v) ? String(v[0]) : String(v);

    const nextRich: Record<RichField, Partial<Record<Locale, string>>> = {
      subtitle: {},
      subdescription: {},
    };

    const assign = (field: string, locale: string | null, message: string) => {
      const allowed = parseAllowedLocales(message);
      if (allowed) {
        setLocaleRefusal({ accepted: allowed, serverMessage: message });
        // Names the map entry to correct, so a backend locale change is a
        // one-line fix in locale-support.ts instead of a hunt.
        reportLocaleMismatch(LOCALE_KEY, allowed);
      }

      // A key with no locale means the error is on the whole field; pin it to
      // the first tab so it is always visible somewhere.
      const target = (locale ?? locales[0]) as Locale;

      if (field === "title" || field === "description") {
        setError(`${field}.${target}`, { type: "server", message });
      } else if (isRichField(field)) {
        nextRich[field][target] = message;
      }
    };

    for (const [key, value] of Object.entries(data)) {
      if (key === "detail") continue;

      if (key.includes(".")) {
        const [field, locale] = key.split(".");
        assign(field, locale, firstMessage(value));
        continue;
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [locale, nested] of Object.entries(
          value as Record<string, unknown>,
        )) {
          assign(key, locale, firstMessage(nested));
        }
        continue;
      }

      assign(key, null, firstMessage(value));
    }

    setRichErrors(nextRich);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setLocaleRefusal(null);
    setRichErrors({ subtitle: {}, subdescription: {} });
    try {
      // PATCH by default. created_at / updated_at are never included.
      const payload: PatchFactoryRequest = {
        title: buildTranslatable(values.title, loaded?.title, locales),
        subtitle: buildTranslatable(rich.subtitle, loaded?.subtitle, locales),
        description: buildTranslatable(values.description, loaded?.description, locales),
        subdescription: buildTranslatable(
          rich.subdescription,
          loaded?.subdescription,
          locales,
        ),
        // Only touch `image` when the editor actually changed it: omitting the
        // key leaves the stored photo alone, null clears it. Re-sending an
        // unchanged URL is what breaks the category edit form.
        ...(imageDirty ? { image: imageUrl } : {}),
      };
      const { data } = await aboutApi.patchFactory(payload);
      toast.success(t("about.factory.updateSuccess"));
      applyRecord(data);
    } catch (error) {
      applyServerErrors(error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message ? t(`about.factory.${message}`, { defaultValue: message }) : undefined;

  /** Small caption naming where the field appears on the public page. */
  const hint = (key: string) => (
    <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
      {t(`about.factory.${key}`)}
    </p>
  );

  const heading = (
    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
      {t("about.factory.title")}
    </h2>
  );

  if (hasError) {
    return (
      <div>
        {heading}
        <Card className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-red-600">{t("about.factory.loadError")}</p>
          <Button variant="secondary" onClick={fetchFactory}>
            {t("about.factory.retry")}
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        {heading}
        <Card className="flex items-center justify-center p-10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      {heading}

      {localeRefusal && (
        <Card className="mb-4 flex items-start gap-3 border-amber-300 p-4 dark:border-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex flex-col gap-1">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {t("about.factory.localeMismatch", {
                locales: localeRefusal.accepted
                  .map((l) => l.toUpperCase())
                  .join(", "),
              })}
            </p>
            {/* The server's own wording, so a constraint we haven't seen
                before is readable rather than paraphrased away. */}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {localeRefusal.serverMessage}
            </p>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* One shared photo for every locale — deliberately outside the tabs. */}
        <Card className="flex flex-col gap-2 p-6">
          <FileUpload
            label={t("about.factory.image")}
            value={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              setImageDirty(true);
            }}
            onUploadingChange={setIsUploadingImage}
            accept="image/*"
          />
          {hint("imageHint")}
        </Card>

        <Card className="p-6">
          <TranslatableFields
            locales={locales}
            fields={["title", "subtitle", "description", "subdescription"]}
            values={{ ...watchedValues, ...rich }}
            errors={{ ...errors, ...richErrors }}
          >
            {(locale) => (
              <>
                <Input
                  label={`${t("about.factory.mainTitle")} (${locale.toUpperCase()})`}
                  error={fieldError(errors.title?.[locale]?.message)}
                  {...register(`title.${locale}` as const)}
                />
                {hint("mainTitleHint")}

                <RichTextEditor
                  label={`${t("about.factory.subtitle")} (${locale.toUpperCase()})`}
                  value={rich.subtitle[locale] ?? ""}
                  onChange={(html) => {
                    setRich((prev) => ({
                      ...prev,
                      subtitle: { ...prev.subtitle, [locale]: html },
                    }));
                    setRichDirty(true);
                  }}
                  error={richErrors.subtitle[locale]}
                />
                {hint("subtitleHint")}

                <Input
                  label={`${t("about.factory.description")} (${locale.toUpperCase()})`}
                  error={fieldError(errors.description?.[locale]?.message)}
                  {...register(`description.${locale}` as const)}
                />
                {hint("descriptionHint")}

                <RichTextEditor
                  label={`${t("about.factory.subdescription")} (${locale.toUpperCase()})`}
                  value={rich.subdescription[locale] ?? ""}
                  onChange={(html) => {
                    setRich((prev) => ({
                      ...prev,
                      subdescription: { ...prev.subdescription, [locale]: html },
                    }));
                    setRichDirty(true);
                  }}
                  error={richErrors.subdescription[locale]}
                />
                {hint("subdescriptionHint")}
              </>
            )}
          </TranslatableFields>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {loaded?.updated_at &&
              t("about.factory.lastUpdated", {
                date: new Date(loaded.updated_at).toLocaleString(i18n.language),
              })}
          </span>
          <Button type="submit" isLoading={isSubmitting} disabled={isUploadingImage}>
            {t("about.factory.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
