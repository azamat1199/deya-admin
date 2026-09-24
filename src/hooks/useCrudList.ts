import { useCallback, useEffect, useState } from "react";
import { fetchAllPages, type ListFetcher } from "../api/pagination";

interface CrudListState<T> {
  items: T[];
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Generic list state for CRUD pages: fetches on mount, exposes refetch and
 * local mutations (upsert/replace/remove) so pages can update rows without
 * a refetch. `fetchList` must be a stable reference (e.g. an api-module
 * function) — passing a new closure each render would refetch in a loop.
 *
 * This hook always yields the COMPLETE list. It used to read `results` off a
 * paginated envelope and silently drop `count`/`next`, so a paginated
 * endpoint would have shown only its first page — which is wrong for the
 * dropdowns and `Math.max(...sort_order) + 1` that depend on it.
 * `fetchAllPages` walks the pages instead; an unpaginated endpoint still
 * costs exactly one request.
 *
 * For a table that should show ONE page at a time, use usePaginatedList.
 */
export function useCrudList<T extends { id: number | string }>(
  fetchList: ListFetcher<T>,
) {
  const [state, setState] = useState<CrudListState<T>>({
    items: [],
    isLoading: true,
    hasError: false,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const items = await fetchAllPages(fetchList);
      setState({ items, isLoading: false, hasError: false });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, hasError: true }));
    }
  }, [fetchList]);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(fetchList)
      .then((items) => {
        if (!cancelled) setState({ items, isLoading: false, hasError: false });
      })
      .catch(() => {
        if (!cancelled)
          setState((prev) => ({ ...prev, isLoading: false, hasError: true }));
      });
    return () => {
      cancelled = true;
    };
  }, [fetchList]);

  const upsert = useCallback((item: T) => {
    setState((prev) => {
      const exists = prev.items.some((i) => i.id === item.id);
      return {
        ...prev,
        items: exists
          ? prev.items.map((i) => (i.id === item.id ? item : i))
          : [item, ...prev.items],
      };
    });
  }, []);

  const replace = useCallback((id: T["id"], updater: (item: T) => T) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? updater(i) : i)),
    }));
  }, []);

  const remove = useCallback((id: T["id"]) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  }, []);

  return {
    items: state.items,
    isLoading: state.isLoading,
    hasError: state.hasError,
    refetch,
    upsert,
    replace,
    remove,
  };
}
