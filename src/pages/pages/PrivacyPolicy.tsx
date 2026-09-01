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
import { pagesApi } from "../../api/pages";
import { getApiErrorMessage } from "../../api/client";
import {
  LOCALES,
  buildTranslatable,
  parseAllowedLocales,
  toTranslatable,
  type Locale,
  type Translatable,
} from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import type { PatchPrivacyPolicyRequest, PrivacyPolicy as Policy } from "../../types/pages";

// Shape follows LOCALES: `satisfies` fails to compile if a locale is added to
// LOCALES without being added here, so the form can't silently drift.
const translatableSchema = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
}) satisfies z.ZodType<Record<Locale, string>>;

const schema = z.object({ title: translatableSchema });

type FormValues = z.infer<typeof schema>;

/** Built from LOCALES rather than a hardcoded literal. */
const emptyTranslatable = (): Translatable =>
  Object.fromEntries(LOCALES.map((l) => [l, ""])) as Translatable;

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor("pages/privacy-policy");

export default function PrivacyPolicy() {
  const { t, i18n } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaded, setLoaded] = useState<Policy | null>(null);

  // Rich text can't be registered with react-hook-form, so body lives in its
  // own per-locale state (same split StaticPageEditor uses).
  const [body, setBody] = useState<Translatable>(emptyTranslatable);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [bodyErrors, setBodyErrors] = useState<Partial<Record<Locale, string>>>(
    {},
  );

  // Set when the API refuses our key set, e.g. "...exactly these languages:
  // ru, en." Which locales this endpoint accepts is not discoverable from a
  // GET while the record is empty.
  const [allowedLocales, setAllowedLocales] = useState<string[] | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: emptyTranslatable() as FormValues["title"] },
  });

  // useWatch rather than watch(): watch() is not memo-safe and makes React
  // Compiler bail out of optimizing the component.
  const watchedValues = useWatch({ control });

  useUnsavedChangesGuard(isDirty || bodyDirty);

  const fetchPolicy = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const { data } = await pagesApi.getPrivacyPolicy();
      // Full objects into state — never resolve to one string on load, or the
      // next save wipes the other locales.
      reset({ title: toTranslatable(data.title) as FormValues["title"] });
      setBody(toTranslatable(data.body));
      setBodyDirty(false);
      setLoaded(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  /* eslint-disable react-hooks/set-state-in-effect -- loads the singleton on
     mount; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /**
   * Maps a DRF 400 onto the matching input. Handles both the flattened
   * ("body.ru") and nested ({ body: { ru: [...] } }) forms, and recovers the
   * accepted locale list from an exact-key-set refusal.
   */
  const applyServerErrors = (error: unknown): void => {
    const data = (
      error as { response?: { data?: Record<string, unknown> } } | undefined
    )?.response?.data;
    if (!data || typeof data !== "object") return;

    const firstMessage = (v: unknown): string =>
      Array.isArray(v) ? String(v[0]) : String(v);

    const nextBodyErrors: Partial<Record<Locale, string>> = {};

    const assign = (field: string, locale: string | null, message: string) => {
      const allowed = parseAllowedLocales(message);
      if (allowed) setAllowedLocales(allowed);

      if (field === "title") {
        // No locale in the key means the error is on the whole field; pin it
        // to the first tab so it is always visible somewhere.
        setError(`title.${(locale ?? locales[0]) as Locale}`, {
          type: "server",
          message,
        });
      } else if (field === "body") {
        nextBodyErrors[(locale ?? locales[0]) as Locale] = message;
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

    setBodyErrors(nextBodyErrors);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setAllowedLocales(null);
    setBodyErrors({});
    try {
      // PATCH by default. created_at / updated_at are never included.
      const payload: PatchPrivacyPolicyRequest = {
        title: buildTranslatable(values.title, loaded?.title, locales),
        body: buildTranslatable(body, loaded?.body, locales),
      };
      const { data } = await pagesApi.patchPrivacyPolicy(payload);
      toast.success(t("pages.privacyPolicy.updateSuccess"));
      reset({ title: toTranslatable(data.title) as FormValues["title"] });
      setBody(toTranslatable(data.body));
      setBodyDirty(false);
      setLoaded(data);
    } catch (error) {
      applyServerErrors(error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message
      ? t(`pages.privacyPolicy.${message}`, { defaultValue: message })
      : undefined;

  const heading = (
    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
      {t("pages.privacyPolicy.title")}
    </h2>
  );

  if (hasError) {
    return (
      <div>
        {heading}
        <Card className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-red-600">
            {t("pages.privacyPolicy.loadError")}
          </p>
          <Button variant="secondary" onClick={fetchPolicy}>
            {t("pages.privacyPolicy.retry")}
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

      {allowedLocales && (
        <Card className="mb-4 flex items-start gap-3 border-amber-300 p-4 dark:border-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {t("pages.privacyPolicy.localeMismatch", {
              locales: allowedLocales.map((l) => l.toUpperCase()).join(", "),
            })}
          </p>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className="p-6">
          <TranslatableFields
            locales={locales}
            fields={["title", "body"]}
            values={{ ...watchedValues, body }}
            errors={{ ...errors, body: bodyErrors }}
          >
            {(locale) => (
              <>
                <Input
                  label={`${t("pages.privacyPolicy.pageTitle")} (${locale.toUpperCase()})`}
                  error={fieldError(errors.title?.[locale]?.message)}
                  {...register(`title.${locale}` as const)}
                />
                <RichTextEditor
                  label={`${t("pages.privacyPolicy.body")} (${locale.toUpperCase()})`}
                  value={body[locale] ?? ""}
                  onChange={(html) => {
                    setBody((prev) => ({ ...prev, [locale]: html }));
                    setBodyDirty(true);
                    if (bodyErrors[locale]) {
                      setBodyErrors((prev) => ({ ...prev, [locale]: undefined }));
                    }
                  }}
                  error={bodyErrors[locale]}
                />
              </>
            )}
          </TranslatableFields>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {loaded?.updated_at &&
              t("pages.privacyPolicy.lastUpdated", {
                date: new Date(loaded.updated_at).toLocaleString(i18n.language),
              })}
          </span>
          <Button type="submit" isLoading={isSubmitting}>
            {t("pages.privacyPolicy.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
