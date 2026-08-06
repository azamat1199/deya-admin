import { SectionsLayout } from "../../components/SectionsLayout";
import { LEADS_SECTIONS } from "./leads-sections";

export default function LeadsLayout() {
  return <SectionsLayout titleKey="leads.title" sections={LEADS_SECTIONS} />;
}
