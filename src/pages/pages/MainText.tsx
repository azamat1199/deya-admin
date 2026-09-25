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

interface Block {
  type: string;
  labelKey: string;
  record: Banner | null;
}

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
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

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
          <p className="text-sm text-red-600">
            {t("pages.mainText.loadError")}
          </p>
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
            prev.map((b) =>
              b.type === updated.type ? { ...b, record: updated } : b,
            ),
          );
          setEditing(null);
        }}
      />
    </div>
  );
}
