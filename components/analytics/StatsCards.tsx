"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import { formatCategory, formatDistrict } from "@/lib/i18n-options";
import type { AnalyticsSummary } from "@/types/analytics";

type StatsCardsProps = {
  summary: AnalyticsSummary;
};

export function StatsCards({ summary }: StatsCardsProps) {
  const { language, t } = useI18n();
  const cards = [
    { label: t("analytics.total"), value: String(summary.total) },
    { label: t("analytics.critical"), value: String(summary.criticalCount) },
    { label: t("analytics.clusterCount"), value: String(summary.clustersCount) },
    { label: t("analytics.processed"), value: `${summary.resolvedPercentage}%` },
    { label: t("analytics.topCategory"), value: formatCategory(summary.mostFrequentCategory, language) },
    { label: t("analytics.topDistrict"), value: formatDistrict(summary.mostActiveDistrict, language) }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} asChild>
          <article className="soft-card p-6">
            <p className="eyebrow">{card.label}</p>
            <p className="mt-3 text-[36px] font-normal tracking-[-0.04em] text-app-text">{card.value}</p>
          </article>
        </Card>
      ))}
    </section>
  );
}
