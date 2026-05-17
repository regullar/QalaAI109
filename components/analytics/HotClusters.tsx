"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import { PRIORITY_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatCategory, formatDistrict } from "@/lib/i18n-options";
import type { HotCluster } from "@/types/analytics";

type HotClustersProps = {
  data: HotCluster[];
};

export function HotClusters({ data }: HotClustersProps) {
  const { language, t } = useI18n();

  return (
    <Card asChild>
      <section className="soft-card p-6">
      <h2 className="text-base font-bold text-app-text">{t("analytics.hotClusters")}</h2>
      {data.length === 0 ? (
        <p className="mt-2 text-sm text-app-textMuted">{t("analytics.noHotClusters")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.slice(0, 10).map((item) => (
            <li key={item.key} className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted p-4">
              <p className="text-sm font-bold text-app-text">
                {formatDistrict(item.district, language)} | {formatCategory(item.category, language)}
              </p>
              <p className="mt-1 text-xs text-app-textMuted">{item.addressText || t("common.addressMissing")}</p>
              <p className="mt-1 text-xs text-app-textMuted">
                {t("common.count")}: {item.count} | {t("common.priority")}: {t(PRIORITY_TRANSLATION_KEYS[item.priority])}
              </p>
            </li>
          ))}
        </ul>
      )}
      </section>
    </Card>
  );
}
