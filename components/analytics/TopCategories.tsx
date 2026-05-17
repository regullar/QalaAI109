"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import { formatCategory } from "@/lib/i18n-options";
import type { CountByCategory } from "@/types/analytics";

type TopCategoriesProps = {
  data: CountByCategory[];
};

export function TopCategories({ data }: TopCategoriesProps) {
  const { language, t } = useI18n();

  return (
    <Card asChild>
      <section className="soft-card p-6">
      <h2 className="text-base font-bold text-app-text">{t("analytics.topCategories")}</h2>
      {data.length === 0 ? (
        <p className="mt-2 text-sm text-app-textMuted">{t("analytics.noCategory")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.slice(0, 8).map((item) => (
            <li key={item.category} className="flex items-center justify-between text-sm">
              <span className="text-app-text">{formatCategory(item.category, language)}</span>
              <span className="rounded-full bg-app-surfaceStrong px-2.5 py-1 text-xs font-semibold text-app-text">
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
      </section>
    </Card>
  );
}
