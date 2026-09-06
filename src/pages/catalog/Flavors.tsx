import { CatalogSimpleSection } from "./CatalogSimpleSection";
import { catalogApi } from "../../api/catalog";
import type { Flavor, FlavorPayload } from "../../types/catalog";

export default function Flavors() {
  return (
    <CatalogSimpleSection<Flavor, FlavorPayload>
      i18nNamespace="catalog.flavors"
      localeKey="catalog/flavors"
      hasImage={false}
      hasIsActive={false}
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
