import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/FileUpload";
import { catalogApi } from "../../api/catalog";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import type { Product, ProductImage } from "../../types/catalog";

const schema = z.object({
  product: z.string().regex(/^\d+$/, "productRequired"),
  alt: z.string(),
  // Soft cap — sort_order's real max is unconfirmed beyond Swagger's
  // generic 32767 example (looks like a SmallIntegerField default).
  sort_order: z.string().regex(/^\d{1,5}$/, "sortOrderInvalid"),
});

type FormValues = z.infer<typeof schema>;

function buildEmptyValues(sortOrder: number): FormValues {
  return { product: "", alt: "", sort_order: String(sortOrder) };
}

export function ProductImageModal({
  isOpen,
  onClose,
  productImage,
  nextSortOrder,
  onSaved,
  products,
  isLoadingProducts,
}: {
  isOpen: boolean;
  onClose: () => void;
  productImage: ProductImage | null;
  nextSortOrder: number;
  onSaved: () => void;
  products: Product[];
  isLoadingProducts: boolean;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isMain, setIsMain] = useState(false);
  const isEditing = Boolean(productImage);

  const productOptions = useMemo(
    () => products.map((p) => ({ value: String(p.id), label: p.name })),
    [products],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildEmptyValues(nextSortOrder),
  });

  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    if (!isOpen) return;
    if (productImage) {
      reset({
        product: String(productImage.product),
        alt: productImage.alt,
        sort_order: String(productImage.sort_order),
      });
    } else {
      reset(buildEmptyValues(nextSortOrder));
    }
    setIsMain(productImage?.is_main ?? false);
    setImageUrl(productImage?.image ?? null);
    setImageError(null);
  }, [isOpen, productImage, nextSortOrder, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: FormValues) => {
    if (!imageUrl) {
      setImageError(t("catalog.productImages.imageRequired"));
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        product: Number(values.product),
        image: imageUrl,
        alt: values.alt,
        is_main: isMain,
        sort_order: Number(values.sort_order),
      };
      // The backend may enforce "only one main image per product", so the
      // list is refetched by the caller instead of merging this response
      // in locally — that keeps other rows' is_main truthful.
      if (productImage) {
        await catalogApi.updateProductImage(productImage.id, payload);
      } else {
        await catalogApi.createProductImage(payload);
      }
      toast.success(
        t(
          productImage
            ? "catalog.productImages.updateSuccess"
            : "catalog.productImages.createSuccess",
        ),
      );
      onSaved();
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
      ? t(`catalog.productImages.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(
        isEditing ? "catalog.productImages.edit" : "catalog.productImages.add",
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="product"
          render={({ field }) => (
            <SearchableSelect
              label={t("catalog.productImages.product")}
              value={field.value}
              onChange={field.onChange}
              options={productOptions}
              isLoading={isLoadingProducts}
              placeholder={t("catalog.productImages.selectProduct")}
              loadingLabel={t("catalog.productImages.loadingProducts")}
              searchPlaceholder={t("catalog.productImages.searchProducts")}
              emptyLabel={t("catalog.productImages.noProductsFound")}
              error={fieldError(errors.product?.message)}
            />
          )}
        />

        <FileUpload
          label={t("catalog.productImages.image")}
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            if (url) setImageError(null);
          }}
          onUploadingChange={setIsUploadingImage}
          error={imageError}
        />

        <Input
          label={t("catalog.productImages.alt")}
          error={fieldError(errors.alt?.message)}
          {...register("alt")}
        />

        <Input
          label={t("catalog.productImages.sortOrder")}
          type="number"
          min={0}
          max={32767}
          error={fieldError(errors.sort_order?.message)}
          {...register("sort_order")}
        />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("catalog.productImages.isMain")}
          </span>
          <Switch
            checked={isMain}
            onChange={setIsMain}
            aria-label={t("catalog.productImages.isMain")}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("catalog.productImages.cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isUploadingImage}
          >
            {t(isEditing ? "catalog.productImages.save" : "catalog.productImages.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
