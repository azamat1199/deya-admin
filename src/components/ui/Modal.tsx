import { useEffect, type ReactNode } from "react";

/**
 * Currently-open modals, in the order they opened. A native listener is
 * attached per instance (see below) rather than one global listener, but
 * only the ID at the END of this stack — the topmost, most-recently-opened
 * modal — is allowed to act on Escape. This is what makes a stacked
 * ConfirmDialog (itself built on Modal) close before the modal underneath it.
 */
const openModalStack: symbol[] = [];

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  // Hooks run on every render regardless of isOpen — the `if (!isOpen)
  // return null` below happens after, per the rules of hooks.
  useEffect(() => {
    if (!isOpen) return;

    const id = Symbol("modal");
    openModalStack.push(id);

    // Bubble phase (the addEventListener default): a child that already
    // handles Escape and calls stopPropagation — a select's dropdown, e.g. —
    // is never seen here, so this never fights an element that already
    // owns the key for its own purpose.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (openModalStack[openModalStack.length - 1] !== id) return;
      onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const index = openModalStack.indexOf(id);
      if (index !== -1) openModalStack.splice(index, 1);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 cursor-pointer bg-black/40"
        onClick={onClose}
      />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
