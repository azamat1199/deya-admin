import { useCallback, useEffect, useState } from "react";

interface CrudListState<T> {
  items: T[];
  isLoading: boolean;
  hasError: boolean;
}

/**
 * DRF paginated responses come back as `{ results: [...] }` instead of a
 * plain array; some list endpoints may also 200 with a single object or
 * null on an empty resource. Normalize defensively so a shape we didn't
 * expect degrades to an empty list instead of crashing the page.
 */
function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

/**
 * Generic list state for CRUD pages: fetches on mount, exposes refetch and
 * local mutations (upsert/replace/remove) so pages can update rows without
 * a refetch. `fetchList` must be a stable reference (e.g. an api-module
 * function) — passing a new closure each render would refetch in a loop.
 */
export function useCrudList<T extends { id: number | string }>(
  fetchList: () => Promise<{ data: T[] }>,
) {
  const [state, setState] = useState<CrudListState<T>>({
    items: [],
    isLoading: true,
    hasError: false,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { data } = await fetchList();
      setState({ items: normalizeList<T>(data), isLoading: false, hasError: false });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, hasError: true }));
    }
  }, [fetchList]);

  useEffect(() => {
    let cancelled = false;
    fetchList()
      .then(({ data }) => {
        if (!cancelled)
          setState({
            items: normalizeList<T>(data),
            isLoading: false,
            hasError: false,
          });
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
