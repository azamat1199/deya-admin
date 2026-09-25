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
import type {
  Banner,
  BannerPayload,
  PatchBannerRequest,
} from "../../types/banners";

const translatableField = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
});
const requiredTranslatable = (message: string) =>
  translatableField.refine((v) => Object.values(v).some((x) => x.trim()), {
    message,
  });

const schema = z.object({
  type: z.enum(
    BANNER_TYPES.map((t) => t.value) as unknown as [
      BannerType,
      ...BannerType[],
    ],
  ),
  title: requiredTranslatable("titleRequired"),
  subtitle: translatableField,
  cta_url: z.string().url("ctaUrlInvalid").or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  type: BANNER_TYPES[0].value,
  title: { ru: "", uz: "", en: "" },
  subtitle: { ru: "", uz: "", en: "" },
  cta_url: "",
};

const EMPTY_TRANSLATABLE = { ru: "", uz: "", en: "" };

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
        type: BANNER_TYPES.some((t) => t.value === data.type)
          ? (data.type as BannerType)
          : BANNER_TYPES[0].value,
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

  const handleCancel = () => {
    if (
      (isDirty || imageDirty) &&
      !window.confirm(t("pages.banners.unsavedChangesConfirm"))
    ) {
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
      const subtitle = buildTranslatable(
        values.subtitle,
        loaded?.subtitle,
        locales,
      );
      const ctaLabel = buildTranslatable(EMPTY_TRANSLATABLE, null, locales);
      const hasCtaUrl = bannerTypeHasCtaUrl(values.type);
      const ctaUrl = hasCtaUrl ? values.cta_url.trim() : "";

      if (id) {
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
    message
      ? t(`pages.banners.${message}`, { defaultValue: message })
      : undefined;

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
