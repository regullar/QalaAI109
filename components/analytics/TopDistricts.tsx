"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import { formatDistrict } from "@/lib/i18n-options";
import type { CountByDistrict } from "@/types/analytics";

type TopDistrictsProps = {
  data: CountByDistrict[];
};

export function TopDistricts({ data }: TopDistrictsProps) {
  const { language, t } = useI18n();

  return (
    <Card asChild>
      <section className="soft-card p-6">
      <h2 className="text-base font-bold text-app-text">{t("analytics.topDistricts")}</h2>
      {data.length === 0 ? (
        <p className="mt-2 text-sm text-app-textMuted">{t("analytics.noDistrict")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.slice(0, 8).map((item) => (
            <li key={item.district} className="flex items-center justify-between text-sm">
              <span className="text-app-text">{formatDistrict(item.district, language)}</span>
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
