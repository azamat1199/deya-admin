import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "../types/i18n";

/**
 * The admin's active locale, narrowed to one the backend stores translations
 * for. i18next reports things like "ru-RU" and can be set to a language we
 * don't have translations for, so the raw value is never trusted directly.
 *
 * Reading i18n.language through useTranslation means components re-render on
 * a language switch, so displayed translations update without a reload.
 */
export function useLocale(): Locale {
  const { i18n } = useTranslation();
  const base = i18n.language?.split("-")[0];
  return LOCALES.includes(base as Locale) ? (base as Locale) : DEFAULT_LOCALE;
}
