/**
 * Locales the BACKEND stores translations for. Note this is deliberately
 * wider than the admin UI's own language set (uz/ru — see LanguageSwitcher):
 * an editor must be able to fill in an English translation for the public
 * site even though the admin chrome itself is never shown in English.
 */
export const LOCALES = ["uz", "ru", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * A translatable field as returned by the API: an object keyed by locale.
 * Partial because a record may simply not have every translation filled in.
 */
export type Translated = Partial<Record<Locale, string>>;

/** Locale used when a record has no translation for the active one. */
export const DEFAULT_LOCALE: Locale = "uz";

/**
 * Reads one locale out of a translatable field for display.
 *
 * Accepts `string` as well as `Translated` so it is safe to call on fields
 * that are not (or are not yet) multilingual — a plain string passes through
 * untouched. Falling back across locales rather than throwing means a record
 * missing a translation renders blank instead of crashing the page.
 *
 * Always use this before putting an API value into JSX, an input value, or a
 * template literal. Passing a raw Translated object into JSX throws
 * "Objects are not valid as a React child".
 */
export function tr(
  value: Translated | string | null | undefined,
  locale: Locale,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.uz || value.ru || value.en || "";
}

/** DRF's paginated list envelope. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
