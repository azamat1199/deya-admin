import { SectionsLayout } from "../../components/SectionsLayout";
import { CATALOG_SECTIONS } from "./catalog-sections";

export default function CatalogLayout() {
  return <SectionsLayout titleKey="catalog.title" sections={CATALOG_SECTIONS} />;
}
