import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export interface SectionConfig {
  labelKey: string;
  path: string;
}

/**
 * Shared tabbed sub-menu layout for modules with multiple CRUD
 * sub-sections (About, Blog, ...). Renders a title + tab row + <Outlet />.
 */
export function SectionsLayout({
  titleKey,
  sections,
}: {
  titleKey: string;
  sections: SectionConfig[];
}) {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
        {t(titleKey)}
      </h1>

      <div className="mb-6 flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {sections.map((section) => (
          <NavLink
            key={section.path}
            to={section.path}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`
            }
          >
            {t(section.labelKey)}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
