import { useState, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { LOCALES, type Locale } from "../../api/i18n";

/**
 * Form values / errors come from react-hook-form and also carry plain
 * (non-translatable) fields, so these are intentionally loose and narrowed
 * at the point of use via `fields`.
 */
type FieldMap = Record<string, unknown>;
type ErrorMap = Record<string, unknown>;

function localeSlot(bag: unknown, field: string, locale: Locale): unknown {
  const group = (bag as Record<string, unknown> | undefined)?.[field];
  if (!group || typeof group !== "object") return undefined;
  return (group as Record<string, unknown>)[locale];
}

/**
 * RU / UZ / EN tab bar that switches every translatable field at once.
 *
 * All locales stay mounted (inactive ones hidden) so react-hook-form keeps
 * their values and validation errors — a hidden tab's error is never lost.
 * The bar marks locales that are incomplete (dot) or invalid (icon), so a
 * user can always locate an error they cannot currently see.
 *
 * Renders children once per locale via a render prop:
 *   <TranslatableFields values={watch()} errors={errors}>
 *     {(locale) => <Input {...register(`title.${locale}`)} />}
 *   </TranslatableFields>
 */
export function TranslatableFields({
  values,
  errors,
  fields,
  locales = LOCALES,
  children,
}: {
  /** Current form values, used to flag incomplete locales. */
  values: FieldMap;
  /** react-hook-form errors, used to flag invalid locales. */
  errors: ErrorMap;
  /** Which keys in `values`/`errors` are translatable. */
  fields: string[];
  /**
   * Locales this endpoint accepts, from localesFor(). Defaults to every
   * locale. Only these tabs render, and only these are checked for
   * completeness — a locale the API rejects must not be offered for editing.
   */
  locales?: readonly Locale[];
  children: (locale: Locale) => ReactNode;
}) {
  const [activeLocale, setActiveLocale] = useState<Locale>(locales[0]);

  // A narrowed `locales` can drop the tab that is currently open (the map is
  // read at render, not frozen at mount), which would leave every panel hidden.
  const currentLocale = locales.includes(activeLocale) ? activeLocale : locales[0];

  const hasError = (locale: Locale) =>
    fields.some((f) => Boolean(localeSlot(errors, f, locale)));

  const isIncomplete = (locale: Locale) =>
    fields.some((f) => {
      const v = localeSlot(values, f, locale);
      return typeof v !== "string" || !v.trim();
    });

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        className="flex gap-1 border-b border-slate-200 dark:border-slate-800"
      >
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={currentLocale === locale}
            onClick={() => setActiveLocale(locale)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              currentLocale === locale
                ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {locale.toUpperCase()}
            {hasError(locale) ? (
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            ) : isIncomplete(locale) ? (
              <span
                className="h-1.5 w-1.5 rounded-full bg-amber-400"
                aria-label="incomplete"
              />
            ) : null}
          </button>
        ))}
      </div>

      {locales.map((locale) => (
        <div
          key={locale}
          hidden={locale !== currentLocale}
          className="flex flex-col gap-4"
        >
          {children(locale)}
        </div>
      ))}
    </div>
  );
}
