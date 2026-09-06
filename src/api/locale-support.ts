/**
 * Which locales each admin endpoint's serializer actually accepts.
 *
 * This exists because the API is NOT uniform. Several serializers validate the
 * key set of a translatable field against a hardcoded tuple and reject anything
 * else with:
 *
 *   "This field must contain exactly these languages: ru, en."
 *
 * Both extra and missing keys fail, so a write must carry exactly the set
 * listed here. This map is the workaround, and it is deliberately the only
 * place the workaround lives — see docs/backend-locale-support.md.
 *
 * `catalog/products`, `careers/companies`, and `about/factory` WERE each
 * restricted to ru/en (see git history), but the backend has since started
 * requiring exactly uz/ru/en on all three — the opposite constraint. Their
 * entries are gone; do not re-add any of them without a fresh 400 confirming
 * which way that endpoint is restricted today.
 *
 * Keys are `<section>/<resource>`, matching the admin URL path.
 *
 * TREAT THIS MAP AS SUSPECT BY DEFAULT, NOT AS A RECORD OF FACT. Three of
 * the four entries ever added here have gone stale and started producing
 * the exact 400 they were meant to prevent. If you hit
 * "must contain exactly these languages" on ANY endpoint, check whether that
 * endpoint has an entry here BEFORE you assume the form is building the
 * wrong payload — a stale entry is now the more likely cause than a bug in
 * the screen.
 *
 * Only add an entry once a real 400 (or a real 200) has confirmed it today —
 * an unverified guess here silently narrows a form that was working. When
 * the backend adds `uz` everywhere, deleting an entry is the whole fix.
 */

import { LOCALES, type Locale } from "./i18n";

export const SUPPORTED_LOCALES: Record<string, readonly Locale[]> = {
  // Confirmed accepting uz — listed explicitly so it reads as measured rather
  // than merely unmeasured.
  "catalog/categories": ["ru", "uz", "en"],
};

/** The locale set for one endpoint. Unlisted endpoints keep the full set. */
export const localesFor = (key: string): readonly Locale[] =>
  SUPPORTED_LOCALES[key] ?? LOCALES;

/**
 * Called when a save is refused with an exact-key-set error. Names the stale
 * map entry in the console so the correction is a one-line edit here rather
 * than a hunt through the screens.
 */
export function reportLocaleMismatch(key: string, accepted: readonly string[]) {
  const current = localesFor(key).join(", ");
  console.warn(
    `[locale-support] SUPPORTED_LOCALES["${key}"] is stale: ` +
      `we send [${current}], the API accepts [${accepted.join(", ")}]. ` +
      `Update src/api/locale-support.ts.`,
  );
}
