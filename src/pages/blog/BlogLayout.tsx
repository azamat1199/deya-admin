import { SectionsLayout } from "../../components/SectionsLayout";
import { BLOG_SECTIONS } from "./blog-sections";

export default function BlogLayout() {
  return <SectionsLayout titleKey="blog.title" sections={BLOG_SECTIONS} />;
}
