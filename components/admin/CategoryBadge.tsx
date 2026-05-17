"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { formatCategory } from "@/lib/i18n-options";

type CategoryBadgeProps = {
  category: string;
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { language } = useI18n();

  return (
    <span className="inline-flex rounded-full bg-app-surfaceStrong px-2.5 py-1 text-xs font-semibold text-app-text">
      {formatCategory(category, language)}
    </span>
  );
}
