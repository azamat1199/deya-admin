import { useTranslation } from "react-i18next";
import { LOCALES, type Locale } from "../api/i18n";

/** Locale used when the admin UI language isn't one the backend stores. */
const FALLBACK: Locale = "ru";

/**
 * The admin's active locale, narrowed to one the backend stores translations
 * for. i18next reports things like "ru-RU", so the raw value is never trusted.
 *
 * Reading i18n.language through useTranslation means components re-render on a
 * language switch, so displayed translations update without a reload.
 */
export function useLocale(): Locale {
  const { i18n } = useTranslation();
  const base = i18n.language?.split("-")[0];
  return LOCALES.includes(base as Locale) ? (base as Locale) : FALLBACK;
}
