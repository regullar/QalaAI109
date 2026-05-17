"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import type { TranslationKey } from "@/lib/i18n";

const problemItems: TranslationKey[] = [
  "problem.what",
  "problem.where",
  "problem.urgent",
  "problem.service",
  "problem.repeat"
];

const solutionItems: TranslationKey[] = [
  "solution.ai",
  "solution.priority",
  "solution.map",
  "solution.clusters",
  "solution.analytics"
];

export function ProblemSection() {
  const { language, t } = useI18n();

  return (
    <section className="space-y-8">
      <div className="max-w-3xl">
        <p className="eyebrow">{language === "kk" ? "Жұмыс логикасы" : "Как это работает"}</p>
        <h2 className="section-title mt-3">
          {language === "kk"
            ? "Еркін мәтіннен қала үшін түсінікті әрекетке дейін"
            : "От свободного текста к понятному действию для города"}
        </h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card asChild>
          <article className="soft-card p-8">
          <h3 className="text-[28px] font-normal leading-[1.08] tracking-[-0.03em] text-app-text">{t("problem.title")}</h3>
          <p className="section-copy mt-4">{t("problem.copy")}</p>
          <ul className="mt-8 space-y-3">
            {problemItems.map((item) => (
              <li key={item} className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-5 py-4 text-[15px] font-medium text-app-text">
                {t(item)}
              </li>
            ))}
          </ul>
          </article>
        </Card>

        <Card asChild>
          <article className="soft-card bg-app-surfaceMuted p-8">
          <h3 className="text-[28px] font-normal leading-[1.08] tracking-[-0.03em] text-app-text">{t("solution.title")}</h3>
          <p className="section-copy mt-4">{t("solution.copy")}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {solutionItems.map((item) => (
              <li key={item} className="rounded-[var(--radius)] border border-app-border bg-white px-5 py-4 text-[15px] font-medium text-app-text">
                {t(item)}
              </li>
            ))}
          </ul>
          </article>
        </Card>
      </div>
    </section>
  );
}
