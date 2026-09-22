import type { TranslatableInput } from "../api/i18n";
import type { BannerType } from "../constants/bannerType";

/**
 * A promotional banner. Confirmed against the schema
 * (BannerAdminRequest/Banner): `title`, `subtitle`, `cta_label` are
 * translatable; `image` and `cta_url` are plain strings. No sort_order, no
 * is_active/is_published flag — this resource has neither.
 */
export interface Banner {
  id: number;
  // Tolerant on read: a type value added backend-side before the admin
  // knows about it should still round-trip rather than break the type.
  // Normalize with a BANNER_TYPES lookup before putting it in a form.
  type: string;
  title: TranslatableInput;
  subtitle: TranslatableInput;
  image: string;
  cta_label: TranslatableInput;
  cta_url: string;
}

/**
 * Create payload. `image`, `title`, `type` are required by the schema;
 * `subtitle`, `cta_label`, `cta_url` are not — `cta_url` stays optional here
 * (rather than sent as "") because the field is `format: uri`, and an empty
 * string is not a valid URI.
 */
export interface BannerPayload {
  type: BannerType;
  title: TranslatableInput;
  subtitle: TranslatableInput;
  cta_label: TranslatableInput;
  cta_url?: string;
  image: string;
}

/**
 * Edit payload. `image` is optional here on purpose: omit it to leave the
 * stored image untouched, or send an explicit null to remove it. Never
 * re-send the loaded display URL unconditionally — the CompanyModal bug.
 */
export type PatchBannerRequest = Partial<Omit<BannerPayload, "image">> & {
  image?: string | null;
};

/**
 * Edit payload for a landing-page text block (see MAIN_TEXT_SECTIONS).
 *
 * One language per FIELD, by deliberate design decision:
 *   ru → title.ru      uz → subtitle.uz      en → cta_label.en
 * Each field is still a full {uz, ru, en} object — the two slots that
 * don't match the field's assigned language are sent as "". See the
 * comment block in MainText.tsx for what this costs on the public site.
 *
 * `cta_url`, `image` and `type` are deliberately absent so they are never
 * sent; timestamps are read-only and never included either.
 */
export interface PatchMainTextRequest {
  title: TranslatableInput;
  subtitle: TranslatableInput;
  cta_label: TranslatableInput;
}
