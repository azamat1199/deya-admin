import type { Paginated } from "./i18n";

/** Query params every paginated list endpoint on this API accepts. */
export interface PageParams {
  page?: number;
  page_size?: number;
}

/**
 * A list getter that may or may not be paginated server-side. Getters that
 * take no arguments at all are assignable to this — TypeScript allows a
 * function to ignore parameters — so the 16 unpaginated screens keep
 * working unchanged.
 */
export type ListFetcher<T> = (
  params?: PageParams,
) => Promise<{ data: T[] | Paginated<T> }>;

/** Page sizes offered in the picker. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

/**
 * Rows per page when the URL doesn't say otherwise. Sent explicitly on
 * every request rather than letting the backend apply its own default, so
 * the row numbers and the "showing X–Y of Z" range are computed from a size
 * we actually chose.
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Only a `{count, next, previous, results}` envelope means the server
 * actually paginated. A plain array means it returned everything and
 * ignored our `page`/`page_size` — the caller must then page client-side.
 */
export function isPaginated<T>(
  data: T[] | Paginated<T>,
): data is Paginated<T> {
  return !Array.isArray(data) && Array.isArray((data as Paginated<T>).results);
}

/** Rows out of either response shape. */
export function rowsOf<T>(data: T[] | Paginated<T>): T[] {
  return isPaginated(data) ? data.results : data;
}

/**
 * Walks every page and returns the complete list.
 *
 * Needed wherever the full set is required rather than a screenful: the
 * product dropdowns in ProductForm/ProductImages/LeadDetailModal, the post
 * titles in PostBlocks, and every `Math.max(...sort_order) + 1` — a partial
 * list there would hand a new record an already-taken sort_order.
 *
 * An unpaginated endpoint costs exactly one request, same as before.
 */
export async function fetchAllPages<T>(fetchList: ListFetcher<T>): Promise<T[]> {
  const first = (await fetchList()).data;
  if (!isPaginated(first)) return first;

  const all = [...first.results];
  const pageSize = first.results.length;
  // A server claiming `next` while returning nothing would loop forever.
  if (pageSize === 0) return all;

  let page = 1;
  let hasNext = first.next !== null;
  while (hasNext && all.length < first.count) {
    page += 1;
    const next = (await fetchList({ page, page_size: pageSize })).data;
    const rows = rowsOf(next);
    all.push(...rows);
    // Stop on an empty or unpaginated page rather than trusting `count`,
    // which can drift if records are written while we're walking.
    if (rows.length === 0 || !isPaginated(next)) break;
    hasNext = next.next !== null;
  }
  return all;
}
