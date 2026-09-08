/**
 * The banner `type` enum — the ONLY place these values are written.
 *
 * `docs/openapi.yaml`'s TypeEb8Enum lists only "partner" (snapshot from
 * 2026-09-03). "main" and "carrier" were confirmed live by a real 200 on
 * PATCH /api/v1/admin/pages/banners/1/ (2026-09-08) — the schema snapshot
 * is stale, not the source of truth here. A fourth value, "about", was
 * briefly included from the same investigation but has since been removed
 * from this admin at the user's request; no live banner ever used it.
 *
 * "carrier" is the backend's actual spelling, not "career" — verified
 * against the same 200, not corrected.
 */
export const BANNER_TYPES = [
  { value: "main", labelKey: "pages.banners.type_main" },
  { value: "carrier", labelKey: "pages.banners.type_carrier" },
  { value: "partner", labelKey: "pages.banners.type_partner" },
] as const;

export type BannerType = (typeof BANNER_TYPES)[number]["value"];

/** Label key for a stored type, tolerating a value not in the list (a type
 * added backend-side before the admin knows about it, or "about" surviving
 * on an old record). */
export function bannerTypeLabelKey(value: string): string {
  return (
    BANNER_TYPES.find((t) => t.value === value)?.labelKey ??
    "pages.banners.type_unknown"
  );
}

/**
 * Whether this type's banner shows a CTA button on the public site — only
 * "carrier" does. `cta_label` is never shown regardless of type (the field
 * exists on the API but has no UI in this admin); this governs `cta_url`
 * alone.
 */
export function bannerTypeHasCtaUrl(type: string): boolean {
  return type === "carrier";
}
