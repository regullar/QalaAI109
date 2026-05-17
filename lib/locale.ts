import type { Language } from "./i18n";

export function getLanguageLocale(language: Language) {
  return language === "kk" ? "kk-KZ" : "ru-RU";
}

export function formatDateTime(value: string | number | Date, language: Language) {
  return new Intl.DateTimeFormat(getLanguageLocale(language), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
