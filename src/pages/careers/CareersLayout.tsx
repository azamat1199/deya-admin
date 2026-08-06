import { SectionsLayout } from "../../components/SectionsLayout";
import { CAREERS_SECTIONS } from "./careers-sections";

export default function CareersLayout() {
  return <SectionsLayout titleKey="careers.title" sections={CAREERS_SECTIONS} />;
}
