import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  isPaginated,
  type ListFetcher,
} from "../api/pagination";
import type { PaginationProps } from "../components/ui/Pagination";

const PAGE_PARAM = "page";
const PAGE_SIZE_PARAM = "page_size";

function readPositiveInt(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Works out the page size the backend ACTUALLY used, from the response
 * alone.
 *
 * We ask for DEFAULT_PAGE_SIZE, but an endpoint that supports `page` and
 * ignores `page_size` would quietly serve its own size. The row numbers,
 * the "showing X–Y" range and the page count are all derived from the page
 * size, so every one of them would be wrong. This proves the real value
 * instead of assuming our request was honoured.
 *
 * Two cases cover every page:
 *  - `next` is set, so this page was filled to capacity: its length IS the
 *    page size.
 *  - we are past page 1 with no `next`, i.e. on the last page: every page
 *    before it was full, so the size divides the records ahead of us
 *    exactly.
 *
 * Page 1 with no `next` means the whole resource fits in one page and the
 * size is genuinely unknowable — and irrelevant, since nothing is hidden.
 */
function detectPageSize(
  rowsOnPage: number,
  count: number,
  next: string | null,
  page: number,
): number | null {
  if (rowsOnPage === 0) return null;
  if (next !== null) return rowsOnPage;
  if (page > 1) {
    const size = (count - rowsOnPage) / (page - 1);
    if (Number.isInteger(size) && size >= rowsOnPage) return size;
  }
  return null;
}

/**
 * One page of a list resource, with `page`/`page_size` mirrored into the URL
 * so F5 and a shared link land on the same page.
 *
 * Two response shapes are handled, because whether these admin endpoints
 * paginate could not be verified against the live API:
 *   - `{count, next, previous, results}` — the server paged; we show
 *     `results` and trust `count`.
 *   - a plain array — the server ignored our params and returned everything;
 *     we slice it here so the controls still work.
 * In the array case every page change refetches the same full list. That is
 * wasteful but keeps one code path, and it is the fallback, not the
 * expected mode.
 */
export function usePaginatedList<T extends { id: number | string }>(
  fetchList: ListFetcher<T>,
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = readPositiveInt(searchParams.get(PAGE_PARAM)) ?? 1;
  const pageSizeFromUrl = readPositiveInt(searchParams.get(PAGE_SIZE_PARAM));

  // What we ask the server for: the URL's size, else the fixed default.
  const requestedPageSize = pageSizeFromUrl ?? DEFAULT_PAGE_SIZE;

  // What the server demonstrably used. Normally identical to the request;
  // it differs only if the endpoint ignores `page_size`, and then this is
  // the value all the maths must use. See detectPageSize.
  const [detectedPageSize, setDetectedPageSize] = useState<number | null>(null);
  const pageSize = detectedPageSize ?? requestedPageSize;

  const [rows, setRows] = useState<T[]>([]);
  const [count, setCount] = useState(0);
  const [serverPaginated, setServerPaginated] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Identifies the newest request so a slow earlier one can't overwrite it.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    try {
      // Sends `requestedPageSize`, never the DETECTED one: feeding the
      // detected value back would make detection retrigger this effect and
      // refetch the same page for nothing.
      const { data } = await fetchList({
        page,
        page_size: requestedPageSize,
      });
      if (id !== requestId.current) return;

      if (isPaginated(data)) {
        setServerPaginated(true);
        setRows(data.results);
        setCount(data.count);
        // Only override when the server proves it used a different size;
        // otherwise stay on the requested one.
        const detected = detectPageSize(
          data.results.length,
          data.count,
          data.next,
          page,
        );
        setDetectedPageSize(
          detected && detected !== requestedPageSize ? detected : null,
        );
      } else {
        setServerPaginated(false);
        setRows(data);
        setCount(data.length);
      }
      setHasError(false);
    } catch {
      if (id !== requestId.current) return;
      setHasError(true);
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [fetchList, page, requestedPageSize]);

  /* eslint-disable react-hooks/set-state-in-effect -- fetches the current
     page on mount and whenever page/page_size change; the documented
     data-fetching effect (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const items = useMemo(() => {
    if (serverPaginated) return rows;
    // Server ignored the params and sent the whole list — slice it here so
    // the controls and the row numbers still mean something.
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [serverPaginated, rows, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const writeParams = useCallback(
    (nextPage: number, nextSize: number | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextPage > 1) next.set(PAGE_PARAM, String(nextPage));
          else next.delete(PAGE_PARAM);
          if (nextSize) next.set(PAGE_SIZE_PARAM, String(nextSize));
          else next.delete(PAGE_SIZE_PARAM);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const clamped = Math.min(Math.max(1, nextPage), totalPages);
      if (clamped === page) return;
      writeParams(clamped, pageSizeFromUrl);
    },
    [page, totalPages, writeParams, pageSizeFromUrl],
  );

  /** Changing the page size always returns to page 1. */
  const setPageSize = useCallback(
    (nextSize: number) => {
      writeParams(1, nextSize);
    },
    [writeParams],
  );

  /** Back to page 1, refetching if we are already there. */
  const goToFirstPage = useCallback(() => {
    if (page === 1) load();
    else writeParams(1, pageSizeFromUrl);
  }, [page, load, writeParams, pageSizeFromUrl]);

  /**
   * After deleting a row: if it was the last one on this page and we aren't
   * on page 1, step back instead of rendering an empty table.
   */
  const afterDelete = useCallback(() => {
    if (items.length <= 1 && page > 1) writeParams(page - 1, pageSizeFromUrl);
    else load();
  }, [items.length, page, writeParams, pageSizeFromUrl, load]);

  /** Local row patch for in-place toggles — does not touch pagination. */
  const replace = useCallback((id: T["id"], updater: (item: T) => T) => {
    setRows((prev) => prev.map((i) => (i.id === id ? updater(i) : i)));
  }, []);

  const pageSizeOptions = useMemo(() => {
    const sizes = new Set<number>(PAGE_SIZE_OPTIONS);
    // Keep whatever the backend actually uses selectable, even if it isn't
    // one of the three offered sizes.
    if (pageSize) sizes.add(pageSize);
    return Array.from(sizes).sort((a, b) => a - b);
  }, [pageSize]);

  // Handed to <DataTable pagination={...}> as-is, so no screen assembles
  // these props itself and the five tables stay literally identical.
  const pagination: PaginationProps = useMemo(
    () => ({
      page,
      pageSize,
      count,
      totalPages,
      pageSizeOptions,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [page, pageSize, count, totalPages, pageSizeOptions, setPage, setPageSize],
  );

  return {
    items,
    count,
    isLoading,
    hasError,
    pagination,
    refetch: load,
    goToFirstPage,
    afterDelete,
    replace,
  };
}
