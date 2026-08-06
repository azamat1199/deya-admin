import { useEffect } from "react";

/**
 * Warns before a browser-level navigation (refresh, tab close, typed URL)
 * when there are unsaved changes. Doesn't cover in-app route changes —
 * this app runs a plain <BrowserRouter> (see main.tsx), not a data
 * router, so react-router's useBlocker (which would catch those) isn't
 * available without a broader router migration.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
