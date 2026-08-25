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
  LOCALES,
  type Translatable,
} from "../../api/i18n";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { slugify } from "../../utils/slugify";
import type { StaticPagePayload } from "../../types/pages";

const translatableField = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
});

const schema = z.object({
  title: translatableField.refine((v) => Object.values(v).some((x) => x.trim()), {
    message: "titleRequired",
  }),
  slug: z.string().regex(/^[a-zA-Z0-9_-]+$/, "slugInvalid"),
});

type FormValues = z.infer<typeof schema>;

export default function StaticPageEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Rich text is held per locale, so switching tabs never loses the
  // other languages and saving never blanks them.
  const [body, setBody] = useState<Translatable>({ ru: "", uz: "", en: "" });
  const [loadedBody, setLoadedBody] = useState<Translatable | null>(null);
  const [loadedTitle, setLoadedTitle] = useState<Translatable | null>(null);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);

  // Tracks whether the user has hand-edited the slug field; once true, the
  // title→slug auto-sync stops so we don't clobber a manual edit.
  const [slugEdited, setSlugEdited] = useState(isEditing);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: { ru: "", uz: "", en: "" }, slug: "" },
  });

  // useWatch instead of watch(): watch() is not memo-safe and makes
  // React Compiler bail out of optimizing the whole component.
  const watchedValues = useWatch({ control });

  useUnsavedChangesGuard(isDirty || bodyDirty);

  const fetchPage = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const { data } = await pagesApi.getStaticPage(Number(id));
      reset({ title: toTranslatable(data.title), slug: data.slug });
      setBody(toTranslatable(data.body));
      setLoadedBody(toTranslatable(data.body));
      setLoadedTitle(toTranslatable(data.title));
      setBodyDirty(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id, reset]);

   
  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    if (isEditing) fetchPage();
  }, [isEditing, fetchPage]);
  /* eslint-enable react-hooks/set-state-in-effect */
   

  const handleCancel = () => {
    if ((isDirty || bodyDirty) && !window.confirm(t("pages.staticPages.unsavedChangesConfirm"))) {
      return;
    }
    navigate("/pages/static-pages");
  };

  const onSubmit = async (values: FormValues) => {
    const hasContent = LOCALES.some(
      (l) => body[l].replace(/<[^>]*>/g, "").trim().length > 0,
    );
    if (!hasContent) {
      setBodyError(t("pages.staticPages.bodyRequired"));
      return;
    }
    setBodyError(null);
    setIsSubmitting(true);
    try {
      const payload: StaticPagePayload = {
        title: buildTranslatable(values.title, loadedTitle),
        slug: values.slug,
        body: buildTranslatable(body, loadedBody),
      };
      if (id) {
        await pagesApi.updateStaticPage(Number(id), payload);
      } else {
        await pagesApi.createStaticPage(payload);
      }
      toast.success(
        t(id ? "pages.staticPages.updateSuccess" : "pages.staticPages.createSuccess"),
      );
      navigate("/pages/static-pages");
    } catch (error) {
      applyApiFieldErrors<FormValues>(error, setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message
      ? t(`pages.staticPages.${message}`, { defaultValue: message })
      : undefined;

  if (isEditing && hasError) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("pages.staticPages.editPage")}
        </h2>
        <Card className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-red-600">{t("pages.staticPages.loadError")}</p>
          <Button variant="secondary" onClick={fetchPage}>
            {t("pages.staticPages.retry")}
          </Button>
        </Card>
      </div>
    );
  }

  if (isEditing && isLoading) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("pages.staticPages.editPage")}
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
        {t(isEditing ? "pages.staticPages.editPage" : "pages.staticPages.addPage")}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-6">
          {/* Title and body sit in separate Cards, so each keeps its own
              tab bar rather than moving one across the existing layout. */}
          <TranslatableFields
            fields={["title"]}
            values={watchedValues}
            errors={errors}
          >
            {(locale) => (
              <Input
                label={`${t("pages.staticPages.pageTitle")} (${locale.toUpperCase()})`}
                error={fieldError(errors.title?.[locale]?.message)}
                {...register(`title.${locale}` as const, {
                  onChange: (e) => {
                    if (!slugEdited && locale === "ru") {
                      setValue("slug", slugify(e.target.value), {
                        shouldValidate: true,
                      });
                    }
                  },
                })}
              />
            )}
          </TranslatableFields>

          <Input
            label={t("pages.staticPages.slug")}
            error={fieldError(errors.slug?.message)}
            {...register("slug", {
              onChange: () => setSlugEdited(true),
            })}
          />
        </Card>

        <Card className="p-6">
          <TranslatableFields
            fields={["body"]}
            values={{ body }}
            errors={errors}
          >
            {(locale) => (
              <RichTextEditor
                label={`${t("pages.staticPages.body")} (${locale.toUpperCase()})`}
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
            {t("pages.staticPages.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t(isEditing ? "pages.staticPages.save" : "pages.staticPages.create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
