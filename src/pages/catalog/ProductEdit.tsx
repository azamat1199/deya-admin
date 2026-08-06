import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/Card";
import { catalogApi } from "../../api/catalog";
import { ProductForm } from "./ProductForm";
import type { Product } from "../../types/catalog";

export default function ProductEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- resets loading/error
     state when navigating between edit pages for different ids; a
     documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setHasError(false);
    catalogApi
      .getProduct(Number(id))
      .then(({ data }) => {
        if (!cancelled) {
          setProduct(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-10">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
      </Card>
    );
  }

  if (hasError || !product) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-600">{t("catalog.products.loadError")}</p>
      </Card>
    );
  }

  return <ProductForm mode="edit" product={product} />;
}
