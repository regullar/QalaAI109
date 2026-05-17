"use client";

import type { TranslationKey } from "@/lib/i18n";
import { useI18n } from "./LanguageProvider";

export function LocalizedText({ id }: { id: TranslationKey }) {
  const { t } = useI18n();
  return <>{t(id)}</>;
}
