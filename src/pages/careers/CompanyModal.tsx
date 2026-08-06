import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { careersApi } from "../../api/careers";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { slugify } from "../../utils/slugify";
import type { Company } from "../../types/careers";

const schema = z.object({
  name: z.string().min(1, "nameRequired"),
  slug: z.string().regex(/^[a-zA-Z0-9_-]+$/, "slugInvalid"),
  description: z.string(),
  vacancies_url: z.string().min(1, "vacanciesUrlRequired"),
});

type FormValues = z.infer<typeof schema>;

/** The backend requires an absolute URL; the field itself stays a plain
 * string input, so add a scheme here if the user left one off. */
function withScheme(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const emptyValues: FormValues = {
  name: "",
  slug: "",
  description: "",
  vacancies_url: "",
};

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
  const isEditing = Boolean(company);

  // Tracks whether the user has hand-edited the slug field; once true, the
  // name→slug auto-sync stops so we don't clobber a manual edit.
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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
    if (company) {
      reset({
        name: company.name,
        slug: company.slug,
        description: company.description,
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
  }, [isOpen, company, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        vacancies_url: withScheme(values.vacancies_url),
        ...(imageUrl ? { image: imageUrl } : {}),
      };
      const { data } = company
        ? await careersApi.updateCompany(company.id, payload)
        : await careersApi.createCompany(payload);
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

        <Textarea
          label={t("careers.companies.description")}
          error={fieldError(errors.description?.message)}
          {...register("description")}
        />

        <FileUpload
          label={`${t("careers.companies.logo")} (${t("careers.companies.optional")})`}
          value={imageUrl}
          onChange={setImageUrl}
          onUploadingChange={setIsUploadingImage}
        />

        <Input
          label={t("careers.companies.vacanciesUrl")}
          placeholder="https://"
          error={fieldError(errors.vacancies_url?.message)}
          {...register("vacancies_url")}
        />

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
