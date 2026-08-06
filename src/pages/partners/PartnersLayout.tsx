import { SectionsLayout } from "../../components/SectionsLayout";
import { PARTNERS_SECTIONS } from "./partners-sections";

export default function PartnersLayout() {
  return <SectionsLayout titleKey="partners.title" sections={PARTNERS_SECTIONS} />;
}
