import { CatalogSimpleSection } from "./CatalogSimpleSection";
import { catalogApi } from "../../api/catalog";
import type { Category } from "../../types/catalog";

export default function Categories() {
  return (
    <CatalogSimpleSection<Category>
      i18nNamespace="catalog.categories"
      localeKey="catalog/categories"
      api={{
        list: catalogApi.getCategories,
        create: catalogApi.createCategory,
        update: catalogApi.updateCategory,
        patch: catalogApi.patchCategory,
        remove: catalogApi.deleteCategory,
      }}
    />
  );
}
