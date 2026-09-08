import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { bannersApi } from "../../api/banners";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import {
  BANNER_TYPES,
  bannerTypeHasCtaUrl,
  type BannerType,
} from "../../constants/bannerType";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import type { Banner, BannerPayload, PatchBannerRequest } from "../../types/banners";

const translatableField = z.object({ ru: z.string(), uz: z.string(), en: z.string() });
const requiredTranslatable = (message: string) =>
  translatableField.refine((v) => Object.values(v).some((x) => x.trim()), {
    message,
  });

// `cta_label` has no field in this form at all — see the submit-time
// constant below — so the schema only covers what's actually editable.
const schema = z.object({
  type: z.enum(
    BANNER_TYPES.map((t) => t.value) as unknown as [BannerType, ...BannerType[]],
  ),
  title: requiredTranslatable("titleRequired"),
  subtitle: translatableField,
  // format:uri on the API and empty isn't a valid URI — same convention as
  // vacancies_url elsewhere: a valid absolute URL, or left blank entirely.
  // Never required: only "carrier" shows this field at all (see
  // bannerTypeHasCtaUrl), and a value left over from a since-abandoned
  // "carrier" selection must not block save on another type.
  cta_url: z.string().url("ctaUrlInvalid").or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

// No default is specified by the schema — this is an arbitrary but
// necessary starting choice (the first option), not a backend-stated
// default. type is required, so this is never submitted un-chosen.
const emptyValues: FormValues = {
  type: BANNER_TYPES[0].value,
  title: { ru: "", uz: "", en: "" },
  subtitle: { ru: "", uz: "", en: "" },
  cta_url: "",
};

/**
 * `cta_label` has no field in this form — no type shows it — so every save
 * sends exactly this rather than mock text or a preserved-but-uneditable
 * value. Always three empty keys, never derived from what was loaded.
 */
const EMPTY_TRANSLATABLE = { ru: "", uz: "", en: "" };

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. No entry exists yet in
    locale-support.ts — unmeasured, so this falls back to the full set. */
const locales = localesFor("pages/banners");

export default function BannerEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaded, setLoaded] = useState<Banner | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // Only send `image` when the user actually changed it: re-sending the
  // stored URL unconditionally is the CompanyModal bug.
  const [imageDirty, setImageDirty] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

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
  const showCtaUrl = bannerTypeHasCtaUrl(watchedValues.type ?? "");

  useUnsavedChangesGuard(isDirty || imageDirty);

  const fetchBanner = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const { data } = await bannersApi.getBanner(Number(id));
      reset({
        // A stored type not in BANNER_TYPES (added backend-side before the
        // admin knows about it, or the removed "about") falls back to the
        // first option rather than leaving the select on an invalid,
        // unselectable value.
        type: BANNER_TYPES.some((t) => t.value === data.type)
          ? (data.type as BannerType)
          : BANNER_TYPES[0].value,
        // Full objects — resolving to one string here would wipe the other
        // languages on the next save.
        title: toTranslatable(data.title),
        subtitle: toTranslatable(data.subtitle),
        cta_url: data.cta_url,
      });
      setImageUrl(data.image || null);
      setImageDirty(false);
      setLoaded(data);
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
    if (isEditing) fetchBanner();
  }, [isEditing, fetchBanner]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCancel = () => {
    if ((isDirty || imageDirty) && !window.confirm(t("pages.banners.unsavedChangesConfirm"))) {
      return;
    }
    navigate("/pages/banners");
  };

  const onSubmit = async (values: FormValues) => {
    if (!isEditing && !imageUrl) {
      setImageError(t("pages.banners.imageRequired"));
      return;
    }
    setImageError(null);
    setIsSubmitting(true);
    try {
      const title = buildTranslatable(values.title, loaded?.title, locales);
      const subtitle = buildTranslatable(values.subtitle, loaded?.subtitle, locales);
      // Always empty — there is no field for this, on any type. `original`
      // is null on purpose: a previously-stored value must not resurface
      // once this admin has nothing to show or edit it.
      const ctaLabel = buildTranslatable(EMPTY_TRANSLATABLE, null, locales);
      // Gated on the CURRENT type, not merely on whether a value is
      // present: a value typed while "carrier" was selected must not leak
      // into the payload after switching to "main"/"partner", even though
      // it's still sitting in form state (see showCtaUrl / point 4).
      const hasCtaUrl = bannerTypeHasCtaUrl(values.type);
      const ctaUrl = hasCtaUrl ? values.cta_url.trim() : "";

      if (id) {
        // PATCH /{id}/ — never PUT: a full replace risks overwriting a
        // language the editor never opened. `type` must be included here:
        // omitting it on edit is what made changing a banner's type
        // impossible before this fix.
        const payload: PatchBannerRequest = {
          type: values.type,
          title,
          subtitle,
          cta_label: ctaLabel,
          ...(ctaUrl ? { cta_url: ctaUrl } : {}),
          ...(imageDirty ? { image: imageUrl } : {}),
        };
        await bannersApi.patchBanner(Number(id), payload);
        toast.success(t("pages.banners.updateSuccess"));
      } else {
        const payload: BannerPayload = {
          type: values.type,
          title,
          subtitle,
          cta_label: ctaLabel,
          ...(ctaUrl ? { cta_url: ctaUrl } : {}),
          image: imageUrl as string,
        };
        await bannersApi.createBanner(payload);
        toast.success(t("pages.banners.createSuccess"));
      }
      navigate("/pages/banners");
    } catch (error) {
      applyApiFieldErrors<FormValues>(error, setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message ? t(`pages.banners.${message}`, { defaultValue: message }) : undefined;

  const heading = (
    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
      {t(isEditing ? "pages.banners.editBanner" : "pages.banners.addBanner")}
    </h2>
  );

  if (isEditing && hasError) {
    return (
      <div>
        {heading}
        <Card className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-red-600">{t("pages.banners.loadError")}</p>
          <Button variant="secondary" onClick={fetchBanner}>
            {t("pages.banners.retry")}
          </Button>
        </Card>
      </div>
    );
  }

  if (isEditing && isLoading) {
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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-6">
          <Select
            label={t("pages.banners.type")}
            options={BANNER_TYPES.map((bt) => ({
              value: bt.value,
              label: t(bt.labelKey),
            }))}
            error={fieldError(errors.type?.message)}
            {...register("type")}
          />

          <FileUpload
            label={t("pages.banners.image")}
            value={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              setImageDirty(true);
              if (imageError) setImageError(null);
            }}
            accept="image/*"
            error={imageError}
          />

          <TranslatableFields
            locales={locales}
            fields={["title", "subtitle"]}
            values={watchedValues}
            errors={errors}
          >
            {(locale) => (
              <>
                <Input
                  label={`${t("pages.banners.pageTitle")} (${locale.toUpperCase()})`}
                  error={fieldError(errors.title?.[locale]?.message)}
                  {...register(`title.${locale}` as const)}
                />
                <Input
                  label={`${t("pages.banners.subtitle")} (${locale.toUpperCase()})`}
                  error={fieldError(errors.subtitle?.[locale]?.message)}
                  {...register(`subtitle.${locale}` as const)}
                />
              </>
            )}
          </TranslatableFields>

          {/* Only "carrier" banners show a CTA button on the public site.
              Conditionally rendered rather than disabled — a hidden
              required-style rule would otherwise block saving main/partner
              banners for no reason visible to the editor. Removed from the
              tree, not just visually hidden: react-hook-form keeps the
              field's last value in its internal state regardless (default
              shouldUnregister:false), so switching back to "carrier"
              restores whatever was typed — no warning dialog needed. */}
          {showCtaUrl && (
            <Input
              label={t("pages.banners.ctaUrl")}
              placeholder="https://"
              error={fieldError(errors.cta_url?.message)}
              {...register("cta_url")}
            />
          )}
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            {t("pages.banners.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t(isEditing ? "pages.banners.save" : "pages.banners.create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
