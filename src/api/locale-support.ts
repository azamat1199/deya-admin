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
 * listed here. `catalog/categories` accepts `uz`; `about/factory` does not
 * (yet). That inconsistency is a backend bug (see
 * docs/backend-locale-support.md) — this map is the workaround, and it is
 * deliberately the only place the workaround lives.
 *
 * `catalog/products` and `careers/companies` WERE restricted to ru/en (see
 * git history), but the backend has since started requiring exactly
 * uz/ru/en on both — the opposite constraint. Their entries are gone; do not
 * re-add either without a fresh 400 confirming which way it's restricted
 * today.
 *
 * Keys are `<section>/<resource>`, matching the admin URL path.
 *
 * An endpoint that is absent falls back to the full LOCALES set, i.e. today's
 * behaviour. Only add an entry once a real 400 (or a real 200) has confirmed
 * it — an unverified guess here silently narrows a form that was working.
 *
 * When the backend adds `uz` everywhere, deleting an entry is the whole fix.
 */

import { LOCALES, type Locale } from "./i18n";

export const SUPPORTED_LOCALES: Record<string, readonly Locale[]> = {
  // Confirmed by a real 400 on PATCH /api/v1/admin/about/factory/.
  "about/factory": ["ru", "en"],
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
