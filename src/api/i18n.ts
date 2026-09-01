/**
 * Single source of truth for multilingual field handling.
 *
 * The backend stores admin-authored free text as an object keyed by locale.
 * Structural fields (slug, id, FK, number, boolean, enum, date, email, URL,
 * upload path, code/SKU) are NEVER wrapped — wrapping one breaks the write.
 *
 * All locale logic lives here. If you find yourself writing a fallback chain
 * or a { uz, ru, en } literal in a component, use these helpers instead.
 */

export const LOCALES = ["ru", "uz", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** A translatable field with every locale present — the shape of FORM STATE. */
export type Translatable = { uz: string; ru: string; en: string };

/**
 * A translatable field as WRITTEN TO or READ FROM the API.
 *
 * Deliberately partial: serializers do not all accept the same locale set
 * (see locale-support.ts), and a write must carry exactly the locales its
 * endpoint accepts — no more, no less. Form state stays complete; only the
 * payload is narrowed.
 */
export type TranslatableInput = Partial<Translatable>;

/** Display fallback order when the requested locale is empty. */
const FALLBACK_ORDER: readonly Locale[] = ["ru", "uz", "en"];

const EMPTY: Translatable = { uz: "", ru: "", en: "" };

/**
 * True when a value is a locale-keyed object rather than a legacy plain
 * string. Guards against a partially migrated backend: some endpoints may
 * still return strings while others return objects.
 */
export function isTranslatable(value: unknown): value is Partial<Translatable> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return LOCALES.some((l) => l in (value as Record<string, unknown>));
}

/**
 * Reads one locale out for DISPLAY. Never returns undefined and never
 * "[object Object]".
 *
 * Fallback: requested locale -> ru -> any non-empty -> "".
 * A legacy plain string passes through untouched.
 */
export function resolve(
  value: Translatable | Partial<Translatable> | string | null | undefined,
  locale: Locale,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (!isTranslatable(value)) return "";

  const direct = value[locale];
  if (direct) return direct;

  for (const l of FALLBACK_ORDER) {
    const candidate = value[l];
    if (candidate) return candidate;
  }
  return "";
}

/**
 * Normalizes an API value into a complete Translatable for EDIT FORM STATE.
 *
 * Always returns all three keys so every input is bound to a string. A legacy
 * plain string is seeded into every locale rather than only one, so saving
 * does not blank the other languages on a not-yet-migrated record.
 *
 * Never resolve to a single string on load — that silently erases the other
 * two translations on the next save.
 */
export function toTranslatable(
  value: Translatable | Partial<Translatable> | string | null | undefined,
): Translatable {
  if (value == null) return { ...EMPTY };
  if (typeof value === "string") {
    return { uz: value, ru: value, en: value };
  }
  if (!isTranslatable(value)) return { ...EMPTY };
  return {
    uz: value.uz ?? "",
    ru: value.ru ?? "",
    en: value.en ?? "",
  };
}

/**
 * Builds the write payload for a translatable field.
 *
 * Emits EXACTLY the keys in `locales` — no more, no less. The backend
 * validator rejects extra keys AND missing ones ("This field must contain
 * exactly these languages: ru, en."), so an accepted locale the user never
 * filled in is sent as "" rather than dropped. Pass the endpoint's set from
 * localesFor(); the default is every locale the admin knows about.
 *
 * `original` is the value loaded from the API. Any locale the user left blank
 * falls back to what was already stored, so an untouched language is never
 * overwritten with "". This is what makes PATCH (and PUT, for endpoints with
 * no PATCH) safe.
 *
 * A locale absent from `locales` is simply omitted from the payload. It is
 * NOT cleared: the key never reaches the server, so whatever is stored there
 * survives — which is what keeps existing Uzbek content safe on endpoints
 * that have since stopped accepting `uz`.
 */
export function buildTranslatable(
  formValue: Partial<Translatable> | undefined,
  original?: Translatable | Partial<Translatable> | string | null,
  locales: readonly Locale[] = LOCALES,
): TranslatableInput {
  const previous = toTranslatable(original);
  const next: TranslatableInput = {};
  for (const l of locales) {
    const typed = formValue?.[l]?.trim();
    next[l] = typed ? typed : previous[l];
  }
  return next;
}

/**
 * Locales with no content — drives the "incomplete" markers in the tab bar.
 * Scoped to `locales` so a hidden tab is never reported as missing.
 */
export function missingLocales(
  value: Partial<Translatable> | undefined,
  locales: readonly Locale[] = LOCALES,
): Locale[] {
  return locales.filter((l) => !value?.[l]?.trim());
}

/** DRF's paginated list envelope. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Pulls the allowed locale list out of the backend's exact-key-set error,
 * e.g. "This field must contain exactly these languages: ru, en."
 *
 * Which locales a serializer accepts is not discoverable from a GET while the
 * record is empty, and it is not uniform across this API (products rejects
 * `uz` while categories accepts it). When a write is refused this recovers the
 * real answer from the message so the UI can say which tabs are accepted
 * instead of showing a raw 400.
 *
 * Returns the codes verbatim (not narrowed to Locale) so a locale the admin
 * doesn't know about is still reported accurately. Null when the message is a
 * different error.
 */
export function parseAllowedLocales(message: string): string[] | null {
  const match = /exactly these languages:\s*([^.]+)/i.exec(message);
  if (!match) return null;
  const codes = match[1]
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);
  return codes.length ? codes : null;
}
