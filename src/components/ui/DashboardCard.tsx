import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

/** A real link, not a div+onClick: native Tab/Enter, native cursor, and a
 * focus ring matching the same treatment Input/Select/Button already use. */
export function DashboardCard({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/50 dark:focus:ring-white/10"
    >
      <Icon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
      <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
        {label}
      </span>
    </Link>
  );
}
