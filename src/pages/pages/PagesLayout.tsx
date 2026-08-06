import { SectionsLayout } from "../../components/SectionsLayout";
import { PAGES_SECTIONS } from "./pages-sections";

export default function PagesLayout() {
  return <SectionsLayout titleKey="pages.title" sections={PAGES_SECTIONS} />;
}
