/**
 * The four landing-page text blocks, stored as ordinary `banners` records
 * distinguished by their `type`. One key = one record; the text itself
 * lives in that record's `title`, which is already a {uz, ru, en} object —
 * all three languages go in its own slots, never spread across
 * title/subtitle/cta_label.
 *
 * `about`, `sub_main` and `sub_main_map` already exist in the database;
 * `about_title` was added later. Confirmed live via GET /api/v1/banners/.
 *
 * This is the ONLY place the four type strings are written — both the
 * MainText screen and the Banners table's filter read it, so a new block
 * appears in one and disappears from the other in a single edit.
 */
export const MAIN_TEXT_SECTIONS = [
  { type: "about_title", labelKey: "pages.mainText.aboutTitle" },
  { type: "about", labelKey: "pages.mainText.about" },
  { type: "sub_main", labelKey: "pages.mainText.subMain" },
  { type: "sub_main_map", labelKey: "pages.mainText.subMainMap" },
] as const;

export type MainTextSectionType = (typeof MAIN_TEXT_SECTIONS)[number]["type"];

/** True for a record that belongs to the MainText screen rather than the
 * ordinary banners table. */
export function isMainTextType(type: string): boolean {
  return MAIN_TEXT_SECTIONS.some((section) => section.type === type);
}
