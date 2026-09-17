import {
  LayoutGrid,
  Info,
  Newspaper,
  Briefcase,
  Package,
  Contact,
  FileText,
  Handshake,
  // Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  path: string;
  icon: LucideIcon;
}

/**
 * Single source of truth for the top-level admin sections — the sidebar
 * renders this, and so does the dashboard grid. Add a row here (plus a
 * route in App.tsx) to register a new top-level section in both places at
 * once; don't add a second list either place consumes separately.
 */
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", path: "/", icon: LayoutGrid },
  { key: "about", path: "/about", icon: Info },
  { key: "blog", path: "/blog", icon: Newspaper },
  { key: "careers", path: "/careers", icon: Briefcase },
  { key: "catalog", path: "/catalog", icon: Package },
  { key: "leads", path: "/leads", icon: Contact },
  { key: "pages", path: "/pages", icon: FileText },
  { key: "partners", path: "/partners", icon: Handshake },
  { key: "auth", path: "/auth", icon: Settings },
  // { key: "users", path: "/users", icon: Users },
];
