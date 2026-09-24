import type { ReactNode } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Card } from "./Card";
import { Pagination, type PaginationProps } from "./Pagination";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (item: T) => ReactNode;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  items,
  isLoading,
  errorMessage,
  emptyMessage,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  actionsHeader,
  viewLabel,
  editLabel,
  deleteLabel,
  rowClassName,
  pagination,
}: {
  columns: Column<T>[];
  items: T[];
  isLoading: boolean;
  errorMessage: string | null;
  emptyMessage: string;
  onRowClick?: (item: T) => void;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  actionsHeader?: string;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  rowClassName?: (item: T) => string;
  /** Omit for an unpaginated table — nothing about the layout changes. */
  pagination?: PaginationProps;
}) {
  const hasActions = Boolean(onView || onEdit || onDelete);

  // Row numbers are a DISPLAY index, never the record's id — ids have gaps,
  // and some resources key rows on a slug instead. Offsetting by the page
  // keeps the sequence continuous: page 2 at size 10 starts at 11, not 1.
  // Unpaginated tables pass no `pagination`, so they simply start at 1.
  const rowNumberOffset = pagination
    ? (pagination.page - 1) * pagination.pageSize
    : 0;

  // Paging to the next page must not collapse the table to a small spinner
  // and bounce the page height. Once rows are on screen, keep them and dim
  // them instead; only the very first load shows the bare spinner.
  const keepsHeightWhileLoading = isLoading && items.length > 0;
  const showsSpinnerOnly = isLoading && items.length === 0;

  return (
    <Card className="overflow-hidden">
      {showsSpinnerOnly ? (
        <div className="flex items-center justify-center p-10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
        </div>
      ) : errorMessage ? (
        <p className="p-6 text-sm text-red-600">{errorMessage}</p>
      ) : items.length === 0 ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="relative overflow-x-auto">
          {keepsHeightWhileLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-white/60 pt-10 dark:bg-slate-900/60">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
            </div>
          )}
          <table
            className={`w-full text-left text-sm ${
              keepsHeightWhileLoading ? "pointer-events-none" : ""
            }`}
          >
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="w-12 px-4 py-3 text-right font-medium tabular-nums">
                  №
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 font-medium ${
                      col.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
                {hasActions && (
                  <th className="px-4 py-3 text-right font-medium">
                    {actionsHeader}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={`${onRowClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : ""} ${
                    rowClassName ? rowClassName(item) : ""
                  }`}
                >
                  <td className="w-12 px-4 py-3 text-right tabular-nums text-slate-400 dark:text-slate-500">
                    {rowNumberOffset + index + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-slate-600 dark:text-slate-300 ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                  {hasActions && (
                    <td
                      className="px-4 py-3"
                      onClick={onRowClick ? (e) => e.stopPropagation() : undefined}
                    >
                      <div className="flex justify-end gap-1">
                        {onView && (
                          <button
                            type="button"
                            onClick={() => onView(item)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            aria-label={viewLabel}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            aria-label={editLabel}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950"
                            aria-label={deleteLabel}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sits below the table so it stays put while rows load, and outside
          the error/empty branches so it is absent exactly when there is
          nothing to page through. */}
      {pagination && !errorMessage && !showsSpinnerOnly && (
        <Pagination {...pagination} />
      )}
    </Card>
  );
}
