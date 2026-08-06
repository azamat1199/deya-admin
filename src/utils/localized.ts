import type { LocalizedText } from "../types/common";

/** Normalizes a possibly-string or possibly-missing localized field. */
export function toLocalizedText(
  value: LocalizedText | string | undefined | null,
): LocalizedText {
  if (!value) return { uz: "", ru: "" };
  if (typeof value === "string") return { uz: value, ru: value };
  return { uz: value.uz ?? "", ru: value.ru ?? "" };
}
