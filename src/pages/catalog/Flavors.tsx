import { CatalogSimpleSection } from "./CatalogSimpleSection";
import { catalogApi } from "../../api/catalog";
import type { Flavor } from "../../types/catalog";

export default function Flavors() {
  return (
    <CatalogSimpleSection<Flavor>
      i18nNamespace="catalog.flavors"
      localeKey="catalog/flavors"
      api={{
        list: catalogApi.getFlavors,
        create: catalogApi.createFlavor,
        update: catalogApi.updateFlavor,
        patch: catalogApi.patchFlavor,
        remove: catalogApi.deleteFlavor,
      }}
    />
  );
}
