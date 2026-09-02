/**
 * The product badge enum — the ONLY place these four values are written.
 *
 * The API field is `badge` (confirmed against GET /api/v1/products/, which
 * returns e.g. `"badge": "new"` as a plain string). It is a single scalar,
 * NOT translatable: it must never go inside the RU/UZ/EN tab group or through
 * buildTranslatable(). The dropdown label is translated; the stored value is
 * not.
 *
 * "Без бейджа" is the empty string — not null, not undefined, and the key is
 * always present in the payload.
 */

export const PRODUCT_BADGES = [
  { value: "", labelKey: "catalog.products.badgeNone" },
  { value: "discount", labelKey: "catalog.products.badge_discount" },
  { value: "new", labelKey: "catalog.products.badge_new" },
  { value: "bestseller", labelKey: "catalog.products.badge_bestseller" },
] as const;

export type ProductBadge = (typeof PRODUCT_BADGES)[number]["value"];

/** The "no badge" value. Referenced instead of a bare "" at call sites. */
export const NO_BADGE: ProductBadge = "";

/** Tailwind chip classes per badge, for the products table. */
export const BADGE_CHIP_CLASS: Record<Exclude<ProductBadge, "">, string> = {
  discount: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  new: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  bestseller:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function isProductBadge(value: string): value is ProductBadge {
  return PRODUCT_BADGES.some((b) => b.value === value);
}

/**
 * Normalizes a stored badge for the edit form.
 *
 * Legacy rows and badges added backend-side can hold a value that isn't in
 * the list. Falling back to "" keeps the select on a valid option instead of
 * rendering blank, and the warning names the value so the list can be
 * extended here rather than debugged in the form.
 */
export function toProductBadge(value: string | null | undefined): ProductBadge {
  if (value == null || value === "") return NO_BADGE;
  if (isProductBadge(value)) return value;
  console.warn(
    `[productBadge] unknown badge "${value}" — falling back to "no badge". ` +
      `Add it to PRODUCT_BADGES in src/constants/productBadge.ts.`,
  );
  return NO_BADGE;
}

/** Label key for a stored badge, tolerating unknown values. */
export function badgeLabelKey(value: string): string {
  return (
    PRODUCT_BADGES.find((b) => b.value === value)?.labelKey ??
    "catalog.products.badgeNone"
  );
}
