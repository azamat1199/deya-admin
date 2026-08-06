import { useTranslation } from "react-i18next";
import { Card } from "../components/ui/Card";

export function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  const title = t(`nav.${titleKey}`);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
        {title}
      </h1>
      <Card className="p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("placeholder.notImplemented", { title })}
        </p>
      </Card>
    </div>
  );
}
