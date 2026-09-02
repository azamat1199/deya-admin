/**
 * Cyrillic → Latin, so a Russian name yields a usable slug instead of an
 * empty string. Without this, `slugify("Вкусная булка")` returns "" — every
 * character is dropped by the a-z0-9 filter — and the form then submits an
 * empty slug that fails both the format check and uniqueness.
 *
 * Uzbek Cyrillic letters that Russian lacks are included, since company and
 * category names mix the two.
 */
const TRANSLITERATE: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e",
  ю: "yu", я: "ya",
  // Uzbek Cyrillic
  ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

/** Converts free text into a lowercase, hyphen-separated slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[Ѐ-ӿ]/g, (ch) => TRANSLITERATE[ch] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
