import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";
import { LANGUAGE_KEY, type Language } from "../i18n";

const LANGUAGES: { code: Language; labelKey: string }[] = [
  { code: "uz", labelKey: "language.uzbek" },
  { code: "ru", labelKey: "language.russian" },
];

export function LanguageSwitcher({ collapsed }: { collapsed: boolean }) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const changeLanguage = (code: Language) => {
    i18n.changeLanguage(code);
    localStorage.setItem(LANGUAGE_KEY, code);
    setIsOpen(false);
  };

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <Globe className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{t(current.labelKey)}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full z-50 mb-1 w-40 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg ${
            collapsed ? "left-full ml-1" : "left-0"
          }`}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                lang.code === i18n.language
                  ? "font-medium text-slate-900"
                  : "text-slate-600"
              }`}
            >
              {t(lang.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
