import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uz from "./locales/uz.json";
import ru from "./locales/ru.json";

export const LANGUAGE_KEY = "deya_admin_language";
export type Language = "uz" | "ru";

const savedLanguage = localStorage.getItem(LANGUAGE_KEY) as Language | null;

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: savedLanguage ?? "uz",
  fallbackLng: "uz",
  interpolation: { escapeValue: false },
});

export default i18n;
