import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { catalogApi } from "../../api/catalog";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { slugify } from "../../utils/slugify";
import type { ProductFamily } from "../../types/catalog";

const schema = z.object({
  name: z.string().min(1, "nameRequired"),
  slug: z.string().regex(/^[a-zA-Z0-9_-]+$/, "slugInvalid"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { name: "", slug: "" };

export function ProductFamilyModal({
  isOpen,
  onClose,
  productFamily,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  productFamily: ProductFamily | null;
  onSaved: (productFamily: ProductFamily) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(productFamily);

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
    if (productFamily) {
      reset({ name: productFamily.name, slug: productFamily.slug });
      // Editing an existing product family: its slug is already
      // established, so don't let further name edits silently rewrite it.
      setSlugEdited(true);
    } else {
      reset(emptyValues);
      setSlugEdited(false);
    }
  }, [isOpen, productFamily, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = { name: values.name, slug: values.slug };
      const { data } = productFamily
        ? await catalogApi.updateProductFamily(productFamily.id, payload)
        : await catalogApi.createProductFamily(payload);
      toast.success(
        t(
          productFamily
            ? "catalog.productFamilies.updateSuccess"
            : "catalog.productFamilies.createSuccess",
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
      ? t(`catalog.productFamilies.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(
        isEditing
          ? "catalog.productFamilies.edit"
          : "catalog.productFamilies.add",
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label={t("catalog.productFamilies.name")}
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
          label={t("catalog.productFamilies.slug")}
          error={fieldError(errors.slug?.message)}
          {...register("slug", {
            onChange: () => setSlugEdited(true),
          })}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("catalog.productFamilies.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t(
              isEditing
                ? "catalog.productFamilies.save"
                : "catalog.productFamilies.create",
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
