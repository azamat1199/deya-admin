import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  pageSize: number;
  count: number;
  totalPages: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/**
 * Builds the page-number strip, collapsing long runs to an ellipsis:
 * 1 … 4 5 [6] 7 8 … 20. Always shows the first and last page so they stay
 * one click away. `null` marks a gap.
 */
function pageNumbers(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const around = [page - 1, page, page + 1].filter(
    (p) => p > 1 && p < totalPages,
  );
  const shown = [1, ...around, totalPages];

  const out: (number | null)[] = [];
  let previous = 0;
  for (const p of shown) {
    if (p - previous > 1) out.push(null);
    out.push(p);
    previous = p;
  }
  return out;
}

const navButtonClass =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-white/20 dark:disabled:hover:text-slate-400";

/**
 * The single pagination control for the whole admin. Rendered by DataTable
 * when a page gives it a `pagination` prop — never duplicated per screen.
 */
export function Pagination({
  page,
  pageSize,
  count,
  totalPages,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation();

  // Nothing to paginate and nothing to count.
  if (count === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
      <p className="text-slate-500 dark:text-slate-400">
        {/* `total`, not `count`: i18next reserves `count` for pluralization
            and would look for showing_one/showing_other, which don't exist. */}
        {t("pagination.showing", { from, to, total: count })}
      </p>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          {t("pagination.perPage")}
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-white/10"
            aria-label={t("pagination.perPage")}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <nav className="flex items-center gap-1" aria-label={t("pagination.label")}>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={navButtonClass}
            aria-label={t("pagination.previous")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageNumbers(page, totalPages).map((p, i) =>
            p === null ? (
              <span
                // Gaps carry no identity of their own; position is stable
                // because the strip is rebuilt whole on every render.
                key={`gap-${i}`}
                className="px-1 text-slate-400 dark:text-slate-600"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 dark:focus-visible:ring-white/20 ${
                  p === page
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={navButtonClass}
            aria-label={t("pagination.next")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
