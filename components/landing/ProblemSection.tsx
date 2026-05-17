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
    <section className="space-y-6 sm:space-y-8">
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
          <article className="soft-card p-5 sm:p-8">
          <h3 className="text-[24px] font-normal leading-[1.08] tracking-[-0.03em] text-app-text sm:text-[28px]">{t("problem.title")}</h3>
          <p className="section-copy mt-4">{t("problem.copy")}</p>
          <ul className="mt-6 space-y-3 sm:mt-8">
            {problemItems.map((item) => (
              <li key={item} className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3.5 text-[15px] font-medium text-app-text sm:px-5 sm:py-4">
                {t(item)}
              </li>
            ))}
          </ul>
          </article>
        </Card>

        <Card asChild>
          <article className="soft-card bg-app-surfaceMuted p-5 sm:p-8">
          <h3 className="text-[24px] font-normal leading-[1.08] tracking-[-0.03em] text-app-text sm:text-[28px]">{t("solution.title")}</h3>
          <p className="section-copy mt-4">{t("solution.copy")}</p>
          <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2">
            {solutionItems.map((item) => (
              <li key={item} className="rounded-[var(--radius)] border border-app-border bg-white px-4 py-3.5 text-[15px] font-medium text-app-text sm:px-5 sm:py-4">
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
