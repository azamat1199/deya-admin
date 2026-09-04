import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { FileUpload } from "../../components/FileUpload";
import { careersApi } from "../../api/careers";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import {
  buildTranslatable,
  parseAllowedLocales,
  toTranslatable,
} from "../../api/i18n";
import { localesFor, reportLocaleMismatch } from "../../api/locale-support";
import { slugify } from "../../utils/slugify";
import type {
  Company,
  CompanyPayload,
  PatchCompanyRequest,
} from "../../types/careers";

/**
 * This model MIXES field types — only `description` is translatable.
 * name / slug / image / vacancies_url are plain strings; wrapping `name` in a
 * locale dict is what produced {"name": ["Not a valid string."]}.
 */
const schema = z.object({
  name: z.string().min(1, "nameRequired"),
  slug: z.string().regex(/^[a-zA-Z0-9_-]+$/, "slugInvalid"),
  description: z.object({ ru: z.string(), uz: z.string(), en: z.string() }),
  vacancies_url: z.string().min(1, "vacanciesUrlRequired"),
});

type FormValues = z.infer<typeof schema>;

/** The backend requires an absolute URL; the field itself stays a plain
 * string input, so add a scheme here if the user left one off. */
function withScheme(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Existing descriptions are plain text with blank-line paragraph breaks (the
 * Bonu Shirinliklar card is three paragraphs). TipTap would collapse that into
 * one paragraph, so promote it to HTML on load. Anything already containing a
 * tag is left alone.
 */
function toEditorHtml(value: string): string {
  if (!value.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((p) => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const emptyValues: FormValues = {
  name: "",
  slug: "",
  description: { ru: "", uz: "", en: "" },
  vacancies_url: "",
};

/** This screen's entry in the per-endpoint locale map. */
const LOCALE_KEY = "careers/companies";

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor(LOCALE_KEY);

export function CompanyModal({
  isOpen,
  onClose,
  company,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onSaved: (company: Company) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // Only send `image` when the user actually changed it: re-sending the stored
  // URL on every save is what breaks the catalog edit form.
  const [imageDirty, setImageDirty] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const isEditing = Boolean(company);

  // Tracks whether the user has hand-edited the slug field; once true, the
  // name→slug auto-sync stops so we don't clobber a manual edit.
  const [slugEdited, setSlugEdited] = useState(false);

  // Set when the API refuses our locale key set.
  const [localeRefusal, setLocaleRefusal] = useState<{
    accepted: string[];
    serverMessage: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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


  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    if (!isOpen) return;
    if (company) {
      const stored = toTranslatable(company.description);
      reset({
        // Already a plain string on the wire — no toTranslatable here.
        name: company.name,
        slug: company.slug,
        description: {
          ru: toEditorHtml(stored.ru),
          uz: toEditorHtml(stored.uz),
          en: toEditorHtml(stored.en),
        },
        vacancies_url: company.vacancies_url,
      });
      // Editing an existing company: its slug is already established, so
      // don't let further name edits silently rewrite it.
      setSlugEdited(true);
    } else {
      reset(emptyValues);
      setSlugEdited(false);
    }
    setImageUrl(company?.image ?? null);
    setImageDirty(false);
    setImageError(null);
    setLocaleRefusal(null);
  }, [isOpen, company, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */


  /** Recovers the accepted locale list from an exact-key-set refusal. */
  const checkLocaleRefusal = (error: unknown) => {
    const data = (
      error as { response?: { data?: Record<string, unknown> } } | undefined
    )?.response?.data;
    if (!data || typeof data !== "object") return;
    for (const value of Object.values(data)) {
      const message = Array.isArray(value) ? String(value[0]) : String(value);
      const accepted = parseAllowedLocales(message);
      if (accepted) {
        setLocaleRefusal({ accepted, serverMessage: message });
        // Names the map entry to correct, so a backend locale change is a
        // one-line fix in locale-support.ts instead of a hunt.
        reportLocaleMismatch(LOCALE_KEY, accepted);
        return;
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    // Required by the schema on create; on edit an untouched image is simply
    // not re-validated here (the stored one stands).
    if (!isEditing && !imageUrl) {
      setImageError(t("careers.companies.imageRequired"));
      return;
    }
    setImageError(null);
    setIsSubmitting(true);
    setLocaleRefusal(null);
    try {
      const description = buildTranslatable(
        values.description,
        company?.description,
        locales,
      );
      // PATCH for edits: PUT demands the complete object, which is why partial
      // edits fail elsewhere in this admin.
      const { data } = company
        ? await careersApi.patchCompany(company.id, {
            name: values.name.trim(),
            slug: values.slug,
            description,
            vacancies_url: withScheme(values.vacancies_url),
            // Omit when untouched, explicit null when removed.
            ...(imageDirty ? { image: imageUrl } : {}),
          } satisfies PatchCompanyRequest)
        : await careersApi.createCompany({
            name: values.name.trim(),
            slug: values.slug,
            description,
            vacancies_url: withScheme(values.vacancies_url),
            image: imageUrl as string,
          } satisfies CompanyPayload);
      toast.success(
        t(
          company
            ? "careers.companies.updateSuccess"
            : "careers.companies.createSuccess",
        ),
      );
      onSaved(data);
      onClose();
    } catch (error) {
      checkLocaleRefusal(error);
      applyApiFieldErrors<FormValues>(error, setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message
      ? t(`careers.companies.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(
        isEditing
          ? "careers.companies.editCompany"
          : "careers.companies.addCompany",
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {localeRefusal && (
          <div className="flex items-start gap-3 rounded-md border border-amber-300 p-3 dark:border-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {t("careers.companies.localeMismatch", {
                  locales: localeRefusal.accepted
                    .map((l) => l.toUpperCase())
                    .join(", "),
                })}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {localeRefusal.serverMessage}
              </p>
            </div>
          </div>
        )}

        {/* Plain fields live ABOVE the tabs — they are the same in every
            language, and `name` in particular must be sent as a string. */}
        <Input
          label={t("careers.companies.name")}
          error={fieldError(errors.name?.message)}
          {...register("name", {
            onChange: (e) => {
              if (!slugEdited) {
                setValue("slug", slugify(e.target.value), {
                  shouldValidate: true,
                });
              }
            },
          })}
        />

        <Input
          label={t("careers.companies.slug")}
          error={fieldError(errors.slug?.message)}
          {...register("slug", {
            onChange: () => setSlugEdited(true),
          })}
        />

        <FileUpload
          label={t("careers.companies.logo")}
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            setImageDirty(true);
            if (imageError) setImageError(null);
          }}
          onUploadingChange={setIsUploadingImage}
          error={imageError}
        />

        <Input
          label={t("careers.companies.vacanciesUrl")}
          placeholder="https://"
          error={fieldError(errors.vacancies_url?.message)}
          {...register("vacancies_url")}
        />

        {/* Only `description` is translatable. */}
        <TranslatableFields
          locales={locales}
          fields={["description"]}
          values={watchedValues}
          errors={errors}
        >
          {(locale) => (
            <RichTextEditor
              label={`${t("careers.companies.description")} (${locale.toUpperCase()})`}
              value={watchedValues.description?.[locale] ?? ""}
              onChange={(html) =>
                setValue(`description.${locale}` as const, html, {
                  shouldDirty: true,
                })
              }
              error={fieldError(errors.description?.[locale]?.message)}
            />
          )}
        </TranslatableFields>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("careers.companies.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingImage}
          >
            {t(
              isEditing ? "careers.companies.save" : "careers.companies.create",
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
