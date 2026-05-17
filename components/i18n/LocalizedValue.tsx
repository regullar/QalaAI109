"use client";

import { useI18n } from "./LanguageProvider";

type LocalizedValueProps = {
  ru: string;
  kk: string;
};

export function LocalizedValue({ ru, kk }: LocalizedValueProps) {
  const { language } = useI18n();
  return <>{language === "kk" ? kk : ru}</>;
}
