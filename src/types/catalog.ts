import type { Translatable, TranslatableInput } from "../api/i18n";
import type { ProductBadge } from "../constants/productBadge";

/**
 * Minimal read/write shape every "simple" catalog resource shares — the
 * generic bound for CatalogSimpleSection/CatalogItemModal. Category's own
 * CatalogItemBase is a superset of this (image, is_active, timestamps);
 * Flavor is not, which is why the shared components are bounded by this
 * narrower pair instead of by CatalogItemBase.
 */
export interface CatalogListItem {
  id: number;
  name: Translatable | string;
  slug: string;
  sort_order: number;
}

export interface CatalogWritePayloadBase {
  name: TranslatableInput;
  slug: string;
  sort_order: number;
}

/** Category's actual shape — unchanged. */
export interface CatalogItemBase {
  id: number;
  name: Translatable | string;
  slug: string;
  image: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogItemPayload {
  name: TranslatableInput;
  slug: string;
  image?: string;
  sort_order: number;
  is_active: boolean;
}

export type Category = CatalogItemBase;
export type CategoryPayload = CatalogItemPayload;
export type PatchCategoryRequest = Partial<CategoryPayload>;

/**
 * Standalone — NOT CatalogItemBase. Confirmed against the schema
 * (FlavorAdminRequest / Flavor): no image, no is_active, no timestamps.
 * `sort_order` is kept because FlavorAdminRequest writes one and the shared
 * list's ordering/next-value logic depends on every resource having one —
 * nothing is added here that the API doesn't actually have.
 */
export interface Flavor {
  id: number;
  name: Translatable | string;
  slug: string;
  sort_order: number;
}

export interface FlavorPayload {
  name: TranslatableInput;
  slug: string;
  sort_order: number;
}

export type PatchFlavorRequest = Partial<FlavorPayload>;

// Confirmed against the schema (ProductFamilyAdminRequest/ProductFamilyAdmin):
// name is a PLAIN STRING, not translatable. Wrapping it produces
// {"name": ["Not a valid string."]}.
export interface ProductFamily {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFamilyPayload {
  name: string;
  slug: string;
}

export type PatchProductFamilyRequest = Partial<ProductFamilyPayload>;

export interface ProductImage {
  id: number;
  product: number;
  image: string;
  alt: Translatable | string;
  is_main: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImagePayload {
  product: number;
  image: string;
  alt: TranslatableInput;
  is_main: boolean;
  sort_order: number;
}

export type PatchProductImageRequest = Partial<ProductImagePayload>;

export interface Product {
  id: number;
  category: number;
  family: number;
  flavor: number;
  name: Translatable | string;
  slug: string;
  description: Translatable | string;
  code: string;
  box_weight: string;
  shelf_life_months: number;
  weights: number[];
  // Tolerant on read: legacy rows may hold null or a value not in the enum.
  // Normalize with toProductBadge() before putting it in a form.
  badge: string | null;
  is_featured: boolean;
  related_products: number[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPayload {
  category: number;
  family: number;
  flavor: number;
  name: TranslatableInput;
  slug: string;
  description: TranslatableInput;
  code: string;
  box_weight: string;
  shelf_life_months: number;
  weights: number[];
  /** "" means "no badge" — always present, never null or omitted. */
  badge: ProductBadge;
  is_featured: boolean;
  related_products: number[];
  sort_order: number;
  is_active: boolean;
}

export type PatchProductRequest = Partial<ProductPayload>;

// Guessed from the prompt's one confirmed example ("g") — the backend's
// Swagger schema was behind auth we couldn't reach to confirm the rest.
// Unmapped/unknown unit strings still round-trip fine (Weight.unit is a
// plain string, not this union) — verify against Swagger and adjust once
// confirmed.
export type WeightUnit = "g" | "kg" | "ml" | "l";
export const WEIGHT_UNITS: WeightUnit[] = ["g", "kg", "ml", "l"];

export interface Weight {
  id: number;
  // Decimal returned as a string by the backend (e.g. "500.00") — keep it
  // a string end-to-end, never coerce to number (precision/formatting is
  // the server's call, not ours).
  value: string;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface WeightPayload {
  value: string;
  unit: string;
}

export type PatchWeightRequest = Partial<WeightPayload>;
