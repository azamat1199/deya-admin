import { useTranslation } from "react-i18next";
import { useAuth } from "../context/useAuth";
import { Card } from "../components/ui/Card";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
        {t("dashboard.title")}
      </h1>
      <Card className="p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("dashboard.welcome", {
            name: user?.username ? `, ${user.username}` : "",
          })}
        </p>
      </Card>
    </div>
  );
}
