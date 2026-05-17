"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGES, translations, type Language, type TranslationKey } from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return !!value && LANGUAGES.includes(value as Language);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru");

  useEffect(() => {
    const stored = window.localStorage.getItem("shymkent-109-language");
    if (isLanguage(stored)) setLanguageState(stored);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("shymkent-109-language", nextLanguage);
    document.documentElement.lang = nextLanguage === "kk" ? "kk" : "ru";
  };

  useEffect(() => {
    document.documentElement.lang = language === "kk" ? "kk" : "ru";
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => translations[language][key] || translations.ru[key]
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useI18n must be used inside LanguageProvider");
  return value;
}
