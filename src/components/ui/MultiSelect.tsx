import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  error?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  loadingLabel?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  id?: string;
}

/**
 * Button + dropdown combobox for picking several values out of a fetched
 * list (e.g. related products). Sibling of SearchableSelect — same
 * interaction model, but toggles options in/out of an array instead of
 * replacing a single value, and shows the selection as removable chips.
 */
export function MultiSelect({
  label,
  error,
  value,
  onChange,
  options,
  isLoading,
  disabled,
  placeholder = "",
  loadingLabel = "",
  searchPlaceholder = "",
  emptyLabel = "",
  id,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [isOpen]);

  const openDropdown = () => {
    setQuery("");
    setIsOpen(true);
  };

  const selectedOptions = useMemo(
    () => options.filter((opt) => value.includes(opt.value)),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggleValue = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  };

  const isDisabled = disabled || isLoading;

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={isDisabled}
          onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
          onKeyDown={(e) => {
            // Stops here so the dropdown closes without the Escape also
            // reaching Modal's document-level listener and closing the
            // whole modal in the same keystroke.
            if (e.key === "Escape") {
              e.stopPropagation();
              setIsOpen(false);
            }
          }}
          className={`flex min-h-[2.375rem] w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-white dark:focus:ring-white/10 ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-slate-300 focus:border-slate-500 dark:border-slate-700 dark:focus:border-slate-500"
          }`}
        >
          {selectedOptions.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {opt.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleValue(opt.value);
                    }}
                    className="rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">
              {isLoading ? loadingLabel : placeholder}
            </span>
          )}
          {isLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          )}
        </button>

        {isOpen && !isDisabled && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                  {emptyLabel}
                </p>
              ) : (
                filteredOptions.map((opt) => {
                  const checked = value.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleValue(opt.value)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span className="truncate">{opt.label}</span>
                      {checked && (
                        <Check className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
