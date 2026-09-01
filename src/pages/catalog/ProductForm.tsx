import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { MultiSelect } from "../../components/ui/MultiSelect";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { catalogApi } from "../../api/catalog";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { buildTranslatable, resolve, toTranslatable } from "../../api/i18n";
import { localesFor } from "../../api/locale-support";
import { useLocale } from "../../hooks/useLocale";
import { slugify } from "../../utils/slugify";
import { useCrudList } from "../../hooks/useCrudList";
import { TranslatableFields } from "../../components/ui/TranslatableFields";
import { PRODUCT_BADGES } from "../../types/catalog";
import type { Product } from "../../types/catalog";

const translatableField = z.object({
  ru: z.string(),
  uz: z.string(),
  en: z.string(),
});

const schema = z.object({
  category: z.string().regex(/^\d+$/, "categoryRequired"),
  family: z.string().regex(/^\d+$/, "familyRequired"),
  flavor: z.string().regex(/^\d+$/, "flavorRequired"),
  name: translatableField.refine(
    (v) => Object.values(v).some((x) => x.trim()),
    {
      message: "nameRequired",
    },
  ),
  slug: z.string().regex(/^[a-zA-Z0-9_-]+$/, "slugInvalid"),
  description: translatableField,
  code: z.string(),
  box_weight: z.string(),
  // Soft cap — the real max is unconfirmed beyond Swagger's generic 32767
  // example (looks like a SmallIntegerField default).
  shelf_life_months: z.string().regex(/^\d{1,5}$/, "shelfLifeInvalid"),
  // Weight ids (FKs into the Weights resource), not free-typed numbers.
  weights: z.array(z.string()),
  badge: z.string(),
  related_products: z.array(z.string()),
  sort_order: z.string().regex(/^\d{1,5}$/, "sortOrderInvalid"),
});

type FormValues = z.infer<typeof schema>;

function buildEmptyValues(sortOrder: number): FormValues {
  return {
    category: "",
    family: "",
    flavor: "",
    name: { ru: "", uz: "", en: "" },
    slug: "",
    description: { ru: "", uz: "", en: "" },
    code: "",
    box_weight: "",
    shelf_life_months: "0",
    weights: [],
    badge: "",
    related_products: [],
    sort_order: String(sortOrder),
  };
}

/** Locales this endpoint accepts. Module scope: a stable reference,
    so it never becomes a hook dependency. */
const locales = localesFor("catalog/products");

export function ProductForm({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: Product;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Tracks whether the user has hand-edited the slug field; once true, the
  // name→slug auto-sync stops so we don't clobber a manual edit.
  const [slugEdited, setSlugEdited] = useState(mode === "edit");

  const categoriesList = useCrudList(catalogApi.getCategories);
  const familiesList = useCrudList(catalogApi.getProductFamilies);
  const flavorsList = useCrudList(catalogApi.getFlavors);
  const productsList = useCrudList(catalogApi.getProducts);
  const weightsList = useCrudList(catalogApi.getWeights);

  const nextSortOrder = useMemo(
    () =>
      productsList.items.length
        ? Math.max(...productsList.items.map((p) => p.sort_order)) + 1
        : 0,
    [productsList.items],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildEmptyValues(0),
  });

  // useWatch instead of watch(): watch() is not memo-safe and makes
  // React Compiler bail out of optimizing the whole component.
  const watchedValues = useWatch({ control });

  /* eslint-disable react-hooks/set-state-in-effect -- resets the form to
     the opened item; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    if (!product) return;
    reset({
      category: String(product.category),
      family: String(product.family),
      flavor: String(product.flavor),
      // full objects in state — never resolve to a string on load
      name: toTranslatable(product.name),
      slug: product.slug,
      description: toTranslatable(product.description),
      code: product.code,
      box_weight: product.box_weight,
      shelf_life_months: String(product.shelf_life_months),
      weights: product.weights.map(String),
      badge: product.badge ?? "",
      related_products: product.related_products.map(String),
      sort_order: String(product.sort_order),
    });
    setIsFeatured(product.is_featured);
    setIsActive(product.is_active);
  }, [product, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Create mode only: once the product list has loaded, default sort_order
  // to max+1 — unless the user has already typed their own value.
  useEffect(() => {
    if (mode !== "create" || productsList.isLoading) return;
    if (dirtyFields.sort_order) return;
    setValue("sort_order", String(nextSortOrder));
  }, [
    mode,
    productsList.isLoading,
    nextSortOrder,
    dirtyFields.sort_order,
    setValue,
  ]);

  const categoryOptions = useMemo(
    () =>
      [...categoriesList.items]
        .sort((a, b) =>
          resolve(a.name, locale).localeCompare(resolve(b.name, locale)),
        )
        .map((c) => ({ value: String(c.id), label: resolve(c.name, locale) })),
    [categoriesList.items, locale],
  );
  const familyOptions = useMemo(
    () =>
      [...familiesList.items]
        .sort((a, b) =>
          resolve(a.name, locale).localeCompare(resolve(b.name, locale)),
        )
        .map((f) => ({ value: String(f.id), label: resolve(f.name, locale) })),
    [familiesList.items, locale],
  );
  const flavorOptions = useMemo(
    () =>
      [...flavorsList.items]
        .sort((a, b) =>
          resolve(a.name, locale).localeCompare(resolve(b.name, locale)),
        )
        .map((f) => ({ value: String(f.id), label: resolve(f.name, locale) })),
    [flavorsList.items, locale],
  );
  const relatedProductOptions = useMemo(
    () =>
      productsList.items
        .filter((p) => mode !== "edit" || p.id !== product?.id)
        .sort((a, b) =>
          resolve(a.name, locale).localeCompare(resolve(b.name, locale)),
        )
        .map((p) => ({ value: String(p.id), label: resolve(p.name, locale) })),
    [productsList.items, mode, product, locale],
  );
  const weightOptions = useMemo(
    () =>
      weightsList.items.map((w) => ({
        value: String(w.id),
        label: `${w.value} ${t(`catalog.weights.unit_${w.unit}`, { defaultValue: w.unit })}`,
      })),
    [weightsList.items, t],
  );

  const badgeOptions = useMemo(() => {
    const values = new Set<string>(PRODUCT_BADGES);
    if (product?.badge) values.add(product.badge);
    return [
      { value: "", label: t("catalog.products.badgeNone") },
      ...Array.from(values).map((value) => ({
        value,
        label: t(`catalog.products.badge_${value}`, { defaultValue: value }),
      })),
    ];
  }, [product, t]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        category: Number(values.category),
        family: Number(values.family),
        flavor: Number(values.flavor),
        name: buildTranslatable(values.name, product?.name, locales),
        slug: values.slug,
        description: buildTranslatable(
          values.description,
          product?.description,
          locales,
        ),
        code: values.code,
        box_weight: values.box_weight,
        shelf_life_months: Number(values.shelf_life_months),
        weights: values.weights.map(Number),
        badge: values.badge || null,
        is_featured: isFeatured,
        related_products: values.related_products.map(Number),
        sort_order: Number(values.sort_order),
        is_active: isActive,
      };
      if (product) {
        await catalogApi.updateProduct(product.id, payload);
      } else {
        await catalogApi.createProduct(payload);
      }
      toast.success(
        t(
          product
            ? "catalog.products.updateSuccess"
            : "catalog.products.createSuccess",
        ),
      );
      navigate("/catalog/products");
    } catch (error) {
      applyApiFieldErrors<FormValues>(error, setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message
      ? t(`catalog.products.${message}`, { defaultValue: message })
      : undefined;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
        {t(mode === "edit" ? "catalog.products.edit" : "catalog.products.add")}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("catalog.products.sectionBasics")}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <SearchableSelect
                  label={t("catalog.products.category")}
                  value={field.value}
                  onChange={field.onChange}
                  options={categoryOptions}
                  isLoading={categoriesList.isLoading}
                  placeholder={t("catalog.products.selectCategory")}
                  loadingLabel={t("catalog.products.loadingOptions")}
                  searchPlaceholder={t("catalog.products.searchOptions")}
                  emptyLabel={t("catalog.products.noOptionsFound")}
                  error={fieldError(errors.category?.message)}
                />
              )}
            />

            <Controller
              control={control}
              name="family"
              render={({ field }) => (
                <SearchableSelect
                  label={t("catalog.products.family")}
                  value={field.value}
                  onChange={field.onChange}
                  options={familyOptions}
                  isLoading={familiesList.isLoading}
                  placeholder={t("catalog.products.selectFamily")}
                  loadingLabel={t("catalog.products.loadingOptions")}
                  searchPlaceholder={t("catalog.products.searchOptions")}
                  emptyLabel={t("catalog.products.noOptionsFound")}
                  error={fieldError(errors.family?.message)}
                />
              )}
            />

            <Controller
              control={control}
              name="flavor"
              render={({ field }) => (
                <SearchableSelect
                  label={t("catalog.products.flavor")}
                  value={field.value}
                  onChange={field.onChange}
                  options={flavorOptions}
                  isLoading={flavorsList.isLoading}
                  placeholder={t("catalog.products.selectFlavor")}
                  loadingLabel={t("catalog.products.loadingOptions")}
                  searchPlaceholder={t("catalog.products.searchOptions")}
                  emptyLabel={t("catalog.products.noOptionsFound")}
                  error={fieldError(errors.flavor?.message)}
                />
              )}
            />
          </div>

          <TranslatableFields
            locales={locales}
            fields={["name", "description"]}
            values={watchedValues}
            errors={errors}
          >
            {(locale) => (
              <>
                <Input
                  label={`${t("catalog.products.name")} (${locale.toUpperCase()})`}
                  error={fieldError(errors.name?.[locale]?.message)}
                  {...register(`name.${locale}` as const, {
                    onChange: (e) => {
                      if (!slugEdited && locale === "ru") {
                        setValue("slug", slugify(e.target.value), {
                          shouldValidate: true,
                        });
                      }
                    },
                  })}
                />
                <Textarea
                  label={`${t("catalog.products.description")} (${locale.toUpperCase()})`}
                  error={fieldError(errors.description?.[locale]?.message)}
                  {...register(`description.${locale}` as const)}
                />
              </>
            )}
          </TranslatableFields>

          <Input
            label={t("catalog.products.slug")}
            error={fieldError(errors.slug?.message)}
            {...register("slug", {
              onChange: () => setSlugEdited(true),
            })}
          />

        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("catalog.products.sectionDetails")}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("catalog.products.code")}
              error={fieldError(errors.code?.message)}
              {...register("code")}
            />

            <Input
              label={`${t("catalog.products.boxWeight")} (${t("catalog.products.optional")})`}
              error={fieldError(errors.box_weight?.message)}
              {...register("box_weight")}
            />

            <Input
              label={t("catalog.products.shelfLifeMonths")}
              type="number"
              min={0}
              max={32767}
              error={fieldError(errors.shelf_life_months?.message)}
              {...register("shelf_life_months")}
            />
          </div>

          <Controller
            control={control}
            name="weights"
            render={({ field }) => (
              <MultiSelect
                label={t("catalog.products.weights")}
                value={field.value}
                onChange={field.onChange}
                options={weightOptions}
                isLoading={weightsList.isLoading}
                placeholder={t("catalog.products.selectWeights")}
                loadingLabel={t("catalog.products.loadingOptions")}
                searchPlaceholder={t("catalog.products.searchOptions")}
                emptyLabel={t("catalog.products.noOptionsFound")}
              />
            )}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("catalog.products.sectionMerchandising")}
          </h2>

          <Select
            label={t("catalog.products.badge")}
            options={badgeOptions}
            {...register("badge")}
          />

          <Controller
            control={control}
            name="related_products"
            render={({ field }) => (
              <MultiSelect
                label={t("catalog.products.relatedProducts")}
                value={field.value}
                onChange={field.onChange}
                options={relatedProductOptions}
                isLoading={productsList.isLoading}
                placeholder={t("catalog.products.selectRelatedProducts")}
                loadingLabel={t("catalog.products.loadingOptions")}
                searchPlaceholder={t("catalog.products.searchOptions")}
                emptyLabel={t("catalog.products.noOptionsFound")}
              />
            )}
          />

          <Input
            label={t("catalog.products.sortOrder")}
            type="number"
            min={0}
            max={32767}
            error={fieldError(errors.sort_order?.message)}
            {...register("sort_order")}
          />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("catalog.products.isFeatured")}
            </span>
            <Switch
              checked={isFeatured}
              onChange={setIsFeatured}
              aria-label={t("catalog.products.isFeatured")}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("catalog.products.status")}
            </span>
            <Switch
              checked={isActive}
              onChange={setIsActive}
              aria-label={t("catalog.products.status")}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/catalog/products")}
          >
            {t("catalog.products.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t(
              mode === "edit"
                ? "catalog.products.save"
                : "catalog.products.create",
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
