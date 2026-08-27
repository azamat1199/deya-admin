import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Pin,
  PinOff,
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
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ProfilePopover } from "./ProfilePopover";

const NAV_ITEMS = [
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

export function Sidebar({
  mobileOpen,
  onNavigate,
  pinned,
  onTogglePinned,
}: {
  mobileOpen: boolean;
  onNavigate: () => void;
  pinned: boolean;
  onTogglePinned: () => void;
}) {
  const { t } = useTranslation();
  const collapsed = !pinned;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-900/10 bg-[#141b3d] transition-[width,transform] duration-200 ease-in-out lg:translate-x-0 ${
        collapsed ? "lg:w-20" : "lg:w-64"
      } w-64 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-white/10 px-4">
        {!collapsed && (
          <span className="truncate text-base font-semibold tracking-tight text-white">
            {t("app.name")}
          </span>
        )}
        <button
          type="button"
          onClick={onTogglePinned}
          className={`hidden shrink-0 rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:flex ${
            collapsed ? "mx-auto" : ""
          }`}
          aria-label={pinned ? "Collapse sidebar" : "Pin sidebar open"}
        >
          {pinned ? (
            <PinOff className="h-4 w-4" />
          ) : (
            <Pin className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onNavigate}
              title={collapsed ? t(`nav.${item.key}`) : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="truncate">{t(`nav.${item.key}`)}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 p-3">
        <LanguageSwitcher collapsed={collapsed} />
        <ProfilePopover collapsed={collapsed} />
      </div>
    </aside>
  );
}
