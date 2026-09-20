import { useTranslation } from "react-i18next";
import { ChangePasswordCard } from "./ChangePasswordCard";

/**
 * The account screen behind /auth — reached from the sidebar and from the
 * "Профиль" item in the profile popover. Only password change lives here
 * today; further account settings become additional cards in this column.
 */
export default function Profile() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
        {t("profile.title")}
      </h1>
      <div className="flex flex-col gap-4">
        <ChangePasswordCard />
      </div>
    </div>
  );
}
