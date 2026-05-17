"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import type { TranslationKey } from "@/lib/i18n";

const stats: Array<{ label: TranslationKey; value: string }> = [
  { label: "stats.total", value: "111k+" },
  { label: "stats.energy", value: "28k+" },
  { label: "stats.districts", value: "5" },
  { label: "stats.categories", value: "14" }
];

export function DemoStats() {
  const { t } = useI18n();

  return (
    <section className="bg-app-dark py-12 text-white sm:py-20 lg:py-24">
      <div className="section-wrap space-y-6 sm:space-y-8">
        <div className="max-w-3xl">
          <p className="eyebrow text-white/72">City scale</p>
          <h2 className="mt-3 text-[30px] font-normal leading-[1.02] tracking-[-0.04em] text-white sm:text-[44px]">
            {t("stats.title")}
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/82 sm:mt-5 sm:text-[16px] sm:leading-8">{t("stats.copy")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="dark-card p-5 sm:p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/74">{t(stat.label)}</p>
              <p className="mt-4 text-[36px] font-normal leading-none tracking-[-0.05em] text-white sm:text-[42px]">{stat.value}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
