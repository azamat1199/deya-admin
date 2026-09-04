import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { pagesApi } from "../../api/pages";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import {
  buildTranslatable,
  toTranslatable,
  type Translatable,
} from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import type { PatchPrivacyPolicyPageRequest } from "../../types/pages";

const translatableField = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
});

const schema = z.object({
  title: translatableField.refine((v) => Object.values(v).some((x) => x.trim()), {
    message: "titleRequired",
  }),
});

type FormValues = z.infer<typeof schema>;

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. No entry exists yet in
    locale-support.ts — unmeasured, so this falls back to the full set. */
const locales = localesFor("pages/privacy-policy");

/**
 * Edit-only: this admin never creates or deletes one of the site's two
 * legal documents, so there is no "isEditing" branch here — `slug` always
 * comes from the route and is always present.
 */
export default function PrivacyPolicyPageEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Rich text is held per locale, so switching tabs never loses the
  // other languages and saving never blanks them.
  const [body, setBody] = useState<Translatable>({ ru: "", uz: "", en: "" });
  const [loadedBody, setLoadedBody] = useState<Translatable | null>(null);
  const [loadedTitle, setLoadedTitle] = useState<Translatable | null>(null);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: { ru: "", uz: "", en: "" } },
  });

  // useWatch instead of watch(): watch() is not memo-safe and makes
  // React Compiler bail out of optimizing the whole component.
  const watchedValues = useWatch({ control });

  useUnsavedChangesGuard(isDirty || bodyDirty);

  const fetchPage = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const { data } = await pagesApi.getPrivacyPolicyPage(slug);
      reset({ title: toTranslatable(data.title) });
      setBody(toTranslatable(data.body));
      setLoadedBody(toTranslatable(data.body));
      setLoadedTitle(toTranslatable(data.title));
      setBodyDirty(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [slug, reset]);


  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    fetchPage();
  }, [fetchPage]);
  /* eslint-enable react-hooks/set-state-in-effect */


  const handleCancel = () => {
    if ((isDirty || bodyDirty) && !window.confirm(t("pages.privacyPolicy.unsavedChangesConfirm"))) {
      return;
    }
    navigate("/pages/privacy-policy");
  };

  const onSubmit = async (values: FormValues) => {
    if (!slug) return;
    const hasContent = locales.some(
      (l) => body[l].replace(/<[^>]*>/g, "").trim().length > 0,
    );
    if (!hasContent) {
      setBodyError(t("pages.privacyPolicy.bodyRequired"));
      return;
    }
    setBodyError(null);
    setIsSubmitting(true);
    try {
      // PATCH /{slug}/ — slug lives in the path only. Deliberately absent
      // from the body: this resource offers no rename, and the type
      // enforces it structurally (no `slug` field), not just by convention.
      const payload: PatchPrivacyPolicyPageRequest = {
        title: buildTranslatable(values.title, loadedTitle, locales),
        body: buildTranslatable(body, loadedBody, locales),
      };
      await pagesApi.patchPrivacyPolicyPage(slug, payload);
      toast.success(t("pages.privacyPolicy.updateSuccess"));
      navigate("/pages/privacy-policy");
    } catch (error) {
      applyApiFieldErrors<FormValues>(error, setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message
      ? t(`pages.privacyPolicy.${message}`, { defaultValue: message })
      : undefined;

  if (hasError) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("pages.privacyPolicy.editPage")}
        </h2>
        <Card className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-red-600">{t("pages.privacyPolicy.loadError")}</p>
          <Button variant="secondary" onClick={fetchPage}>
            {t("pages.privacyPolicy.retry")}
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("pages.privacyPolicy.editPage")}
        </h2>
        <Card className="flex items-center justify-center p-10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        {t("pages.privacyPolicy.editPage")}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-6">
          {/* Title and body sit in separate Cards, so each keeps its own
              tab bar rather than moving one across the existing layout. */}
          <TranslatableFields
            locales={locales}
            fields={["title"]}
            values={watchedValues}
            errors={errors}
          >
            {(locale) => (
              <Input
                label={`${t("pages.privacyPolicy.pageTitle")} (${locale.toUpperCase()})`}
                error={fieldError(errors.title?.[locale]?.message)}
                {...register(`title.${locale}` as const)}
              />
            )}
          </TranslatableFields>

          <div className="flex flex-col gap-1.5">
            <Input label={t("pages.privacyPolicy.slug")} value={slug ?? ""} disabled />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("pages.privacyPolicy.slugLocked")}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <TranslatableFields
            locales={locales}
            fields={["body"]}
            values={{ body }}
            errors={errors}
          >
            {(locale) => (
              <RichTextEditor
                label={`${t("pages.privacyPolicy.body")} (${locale.toUpperCase()})`}
                value={body[locale]}
                onChange={(html) => {
                  setBody((prev) => ({ ...prev, [locale]: html }));
                  setBodyDirty(true);
                  if (bodyError) setBodyError(null);
                }}
                error={bodyError ?? undefined}
              />
            )}
          </TranslatableFields>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            {t("pages.privacyPolicy.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t("pages.privacyPolicy.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
