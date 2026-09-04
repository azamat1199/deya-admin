import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { pagesApi } from "../../api/pages";
import { resolve } from "../../api/i18n";
import { useLocale } from "../../hooks/useLocale";
import { useCrudList } from "../../hooks/useCrudList";
import type { PrivacyPolicyPage } from "../../types/pages";

/**
 * The site has exactly two legal documents, forever — there is no create
 * flow, so any other slug is stray data (that's how "" and "body" ended up
 * in this list before). Filtered out here rather than hidden by a backend
 * fix, and logged so a stray record is still visible in the console instead
 * of silently vanishing.
 */
const EXPECTED_SLUGS = ["privacy-policy", "personal-data-consent"];

/** The resource has no id — it's keyed by slug. useCrudList/DataTable both
 * key rows by `id: number | string`, so the slug stands in for it here. */
type Row = PrivacyPolicyPage & { id: string };

const fetchRows = () =>
  pagesApi.getPrivacyPolicyPages().then((res) => {
    const rows: Row[] = [];
    for (const p of res.data) {
      if (EXPECTED_SLUGS.includes(p.slug)) {
        rows.push({ ...p, id: p.slug });
      } else {
        console.warn(
          `[privacy-policy] unexpected slug "${p.slug}" — hidden from the list. ` +
            `This admin only edits privacy-policy and personal-data-consent; ` +
            `anything else is stray data, not something to delete or rename from here.`,
        );
      }
    }
    return { data: rows };
  });

export default function PrivacyPolicy() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const { items, isLoading, hasError } = useCrudList(fetchRows);

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: t("pages.privacyPolicy.pageTitle"),
      render: (p) => (
        <span className="text-slate-900 dark:text-white">
          {resolve(p.title, locale)}
        </span>
      ),
    },
    {
      key: "slug",
      header: t("pages.privacyPolicy.slug"),
      render: (p) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {p.slug}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: t("pages.privacyPolicy.updatedAt"),
      render: (p) =>
        p.updated_at
          ? new Date(p.updated_at).toLocaleString(i18n.language)
          : "—",
    },
    {
      key: "actions",
      header: t("pages.privacyPolicy.actions"),
      align: "right",
      render: (p) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              navigate(`/pages/privacy-policy/${encodeURIComponent(p.slug)}/edit`)
            }
            aria-label={t("pages.privacyPolicy.editPage")}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        {t("pages.privacyPolicy.title")}
      </h2>

      <DataTable
        columns={columns}
        items={items}
        isLoading={isLoading}
        errorMessage={hasError ? t("pages.privacyPolicy.loadError") : null}
        emptyMessage={t("pages.privacyPolicy.empty")}
      />
    </div>
  );
}
