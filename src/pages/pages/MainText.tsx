import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Pencil } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { bannersApi } from "../../api/banners";
import { toTranslatable } from "../../api/i18n";
import { MAIN_TEXT_SECTIONS } from "../../constants/mainTextSections";
import { MainTextModal } from "./MainTextModal";
import type { Banner } from "../../types/banners";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * HOW THESE RECORDS STORE LANGUAGES — READ BEFORE WIRING THE PUBLIC SITE
 * ─────────────────────────────────────────────────────────────────────────
 * Each landing-page text block is one `banners` record, identified by its
 * `type` (about_title / about / sub_main / sub_main_map). The three
 * languages of the SAME text are spread across three different FIELDS:
 *
 *     Russian  → title.ru
 *     Uzbek    → subtitle.uz
 *     English  → cta_label.en
 *
 * Every one of those fields is itself a {uz, ru, en} object, and the two
 * slots that don't match the field's assigned language are stored as "".
 * So the language is encoded twice — by which field it's in AND by which
 * key inside it — and those two always agree.
 *
 * CONSEQUENCE, deliberate and accepted: the public site will NOT find the
 * Uzbek text where it would normally look. A /uz page resolving `title`
 * gets title.uz, which is empty here — the Uzbek text is in subtitle.uz.
 * Same for English: it is in cta_label.en, not title.en.
 *
 * When these texts are connected to the landing page, the site must read
 * them with this same inverted mapping, NOT through the usual
 * resolve(title, locale) path that every other resource uses. Anything
 * that assumes "one field, three language slots" will silently render
 * empty strings for uz and en.
 * ─────────────────────────────────────────────────────────────────────────
 */

interface Block {
  type: string;
  labelKey: string;
  /** null when no record with this type exists yet. */
  record: Banner | null;
}

/** Russian preview for the list — see the mapping note above. */
function previewText(record: Banner | null): string {
  if (!record) return "";
  return toTranslatable(record.title).ru;
}

export default function MainText() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editing, setEditing] = useState<Block | null>(null);

  const fetchBlocks = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const { data } = await bannersApi.getBanners();
      // First matching record per type — duplicates exist in the data and
      // are deliberately ignored here rather than deleted.
      setBlocks(
        MAIN_TEXT_SECTIONS.map((section) => ({
          type: section.type,
          labelKey: section.labelKey,
          record: data.find((b) => b.type === section.type) ?? null,
        })),
      );
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- loads the records on
     mount; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const heading = (
    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
      {t("pages.mainText.title")}
    </h2>
  );

  if (hasError) {
    return (
      <div>
        {heading}
        <Card className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-red-600">{t("pages.mainText.loadError")}</p>
          <Button variant="secondary" onClick={fetchBlocks}>
            {t("pages.mainText.retry")}
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        {heading}
        <Card className="flex items-center justify-center p-10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      {heading}

      <div className="flex flex-col gap-4">
        {blocks.map((block) => (
          <Card key={block.type} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t(block.labelKey)}
                </h3>
                {block.record ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {previewText(block.record) || t("pages.mainText.emptyText")}
                  </p>
                ) : (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {t("pages.mainText.missingRecord", { type: block.type })}
                  </p>
                )}
              </div>

              {/* Editing only — this screen never creates or deletes. */}
              <Button
                variant="secondary"
                disabled={!block.record}
                onClick={() => setEditing(block)}
              >
                <Pencil className="h-4 w-4" />
                {t("pages.mainText.edit")}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <MainTextModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        record={editing?.record ?? null}
        labelKey={editing?.labelKey ?? "pages.mainText.title"}
        onSaved={(updated) => {
          setBlocks((prev) =>
            prev.map((b) => (b.type === updated.type ? { ...b, record: updated } : b)),
          );
          setEditing(null);
        }}
      />
    </div>
  );
}
