import { SectionsLayout } from "../../components/SectionsLayout";
import { ABOUT_SECTIONS } from "./about-sections";

export default function AboutLayout() {
  return <SectionsLayout titleKey="about.title" sections={ABOUT_SECTIONS} />;
}
