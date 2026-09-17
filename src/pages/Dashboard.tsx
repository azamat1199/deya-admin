import { useTranslation } from "react-i18next";
import { useAuth } from "../context/useAuth";
import { DashboardCard } from "../components/ui/DashboardCard";
import { NAV_ITEMS } from "../components/nav-items";
import { ABOUT_SECTIONS } from "./about/about-sections";
import { BLOG_SECTIONS } from "./blog/blog-sections";
import { CAREERS_SECTIONS } from "./careers/careers-sections";
import { CATALOG_SECTIONS } from "./catalog/catalog-sections";
import { LEADS_SECTIONS } from "./leads/leads-sections";
import { PAGES_SECTIONS } from "./pages/pages-sections";
import { PARTNERS_SECTIONS } from "./partners/partners-sections";

/**
 * The sidebar's NAV_ITEMS is one level (top-level sections only) — it has
 * no sub-page grouping of its own. Each section's own *-sections.ts file
 * already IS that grouping — it drives that section's real tab bar today —
 * so this maps a nav key to its existing sections file rather than
 * restating any labels or paths. A key with no entry here (only "auth"
 * today) has no sub-pages of its own; it renders as a single card pointing
 * at the nav item's own route instead.
 */
const SECTIONS_BY_NAV_KEY: Record<
  string,
  readonly { labelKey: string; path: string }[]
> = {
  about: ABOUT_SECTIONS,
  blog: BLOG_SECTIONS,
  careers: CAREERS_SECTIONS,
  catalog: CATALOG_SECTIONS,
  leads: LEADS_SECTIONS,
  pages: PAGES_SECTIONS,
  partners: PARTNERS_SECTIONS,
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // "dashboard" is this page itself — a card linking back here would be
  // pointless, so it's the one NAV_ITEMS entry excluded from the grid.
  const groups = NAV_ITEMS.filter((item) => item.key !== "dashboard");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("dashboard.welcome", {
            name: user?.username ? `, ${user.username}` : "",
          })}
        </p>
      </div>

      {groups.map((group) => {
        const sections = SECTIONS_BY_NAV_KEY[group.key];
        const cards = sections
          ? sections.map((section) => ({
              key: section.path,
              to: `${group.path}/${section.path}`,
              labelKey: section.labelKey,
            }))
          : [{ key: group.key, to: group.path, labelKey: `nav.${group.key}` }];
        const GroupIcon = group.icon;

        return (
          <section key={group.key}>
            <div className="mb-3 flex items-center gap-2">
              <GroupIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t(`nav.${group.key}`)}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <DashboardCard
                  key={card.key}
                  to={card.to}
                  icon={GroupIcon}
                  label={t(card.labelKey)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
