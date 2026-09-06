import { CatalogSimpleSection } from "./CatalogSimpleSection";
import { catalogApi } from "../../api/catalog";
import type { Category, CategoryPayload } from "../../types/catalog";

export default function Categories() {
  return (
    <CatalogSimpleSection<Category, CategoryPayload>
      i18nNamespace="catalog.categories"
      localeKey="catalog/categories"
      hasImage
      hasIsActive
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
