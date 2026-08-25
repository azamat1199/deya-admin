import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { ErrorBoundary } from "../components/ErrorBoundary";

const PINNED_KEY = "deya_admin_sidebar_pinned";

export function AdminLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useState(
    () => localStorage.getItem(PINNED_KEY) !== "false",
  );

  const togglePinned = () => {
    setPinned((prev) => {
      const next = !prev;
      localStorage.setItem(PINNED_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        pinned={pinned}
        onTogglePinned={togglePinned}
      />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 cursor-pointer bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className={pinned ? "lg:pl-64" : "lg:pl-20"}>
        <Header onToggleSidebar={() => setMobileOpen((v) => !v)} />
        <main className="p-4 lg:p-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
