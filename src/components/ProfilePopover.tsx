import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Sun, Monitor, Moon, User, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";
import type { Theme } from "../context/theme-context";

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: "light", icon: Sun, labelKey: "profile.themeLight" },
  { value: "system", icon: Monitor, labelKey: "profile.themeSystem" },
  { value: "dark", icon: Moon, labelKey: "profile.themeDark" },
];

export function ProfilePopover({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Failed to log out");
    }
  };

  const initials = (user?.username ?? "A").slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/10 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
          {initials}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              {user?.username ?? "Admin"}
            </span>
            <span className="block text-xs text-white/60">
              {(user?.role ?? "admin").toString().toUpperCase()}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full z-50 mb-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ${
            collapsed ? "left-full ml-2" : "left-0"
          }`}
        >
          <div className="flex items-center gap-2.5 border-b border-slate-100 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.username ?? "Admin"}
              </p>
              <p className="text-xs text-slate-500">
                {(user?.role ?? "admin").toString().toUpperCase()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate("/auth");
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <User className="h-4 w-4" />
            {t("profile.profile")}
          </button>

          <div className="border-t border-slate-100 px-3 py-2.5">
            <div className="flex overflow-hidden rounded-md border border-slate-200">
              {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex flex-1 flex-col items-center gap-1 px-2 py-1.5 text-xs transition-colors ${
                    theme === value
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            {t("profile.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
