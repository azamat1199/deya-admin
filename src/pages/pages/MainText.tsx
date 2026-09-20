import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { bannersApi } from "../../api/banners";
import { MainTextModal } from "./MainTextModal";
import type { Banner } from "../../types/banners";

const MAIN_TEXT_TYPE = "main_text";

export default function MainText() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [record, setRecord] = useState<Banner | null>(null);
  // Set when more than one main_text record exists — surfaced rather than
  // silently picking one, per the brief: report it, don't hide it.
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRecord = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const { data } = await bannersApi.getBanners();
      const matches = data.filter((b) => b.type === MAIN_TEXT_TYPE);
      // Never created here — an empty result is a real state to show, not
      // something to paper over by creating a record.
      setRecord(matches[0] ?? null);
      setDuplicateCount(matches.length > 1 ? matches.length : 0);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- loads the singleton
     record on mount; a documented, standard effect use case
     (https://react.dev/learn/you-might-not-need-an-effect) */
  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);
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
          <Button variant="secondary" onClick={fetchRecord}>
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

  if (!record) {
    return (
      <div>
        {heading}
        <Card className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("pages.mainText.notFound")}
          </p>
          <Button variant="secondary" onClick={fetchRecord}>
            {t("pages.mainText.retry")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {heading}

      {duplicateCount > 1 && (
        <Card className="mb-4 flex items-start gap-3 border-amber-300 p-4 dark:border-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {t("pages.mainText.duplicateWarning", {
              count: duplicateCount,
              id: record.id,
            })}
          </p>
        </Card>
      )}

      <Card className="flex items-center justify-between p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("pages.mainText.description")}
        </p>
        <Button onClick={() => setIsModalOpen(true)}>
          {t("pages.mainText.edit")}
        </Button>
      </Card>

      <MainTextModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        banner={record}
        onSaved={(updated) => {
          setRecord(updated);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
