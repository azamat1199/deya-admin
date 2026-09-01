import type { Translatable, TranslatableInput } from "../api/i18n";

/** Shared shape for simple catalog resources (Categories, Flavors, ...). */
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

export type Flavor = CatalogItemBase;
export type FlavorPayload = CatalogItemPayload;
export type PatchFlavorRequest = Partial<FlavorPayload>;

export interface ProductFamily {
  id: number;
  name: Translatable | string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFamilyPayload {
  name: TranslatableInput;
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

// Guessed from the prompt's one confirmed example ("new") — the backend's
// Swagger schema was behind auth we couldn't reach to confirm the rest, or
// whether the field is nullable. Unmapped/unknown badge strings still
// round-trip fine (Product.badge is a plain string, not this union) —
// verify against Swagger and adjust once confirmed.
export type ProductBadge = "new" | "hit" | "sale";
export const PRODUCT_BADGES: ProductBadge[] = ["new", "hit", "sale"];

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
  badge: string | null;
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
