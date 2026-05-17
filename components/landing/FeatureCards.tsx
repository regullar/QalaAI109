"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { TranslationKey } from "@/lib/i18n";

const features: Array<{ title: TranslationKey; description: TranslationKey; icon: string }> = [
  { title: "features.ai.title", description: "features.ai.desc", icon: "auto_awesome" },
  { title: "features.priority.title", description: "features.priority.desc", icon: "warning" },
  { title: "features.map.title", description: "features.map.desc", icon: "map" },
  { title: "features.clusters.title", description: "features.clusters.desc", icon: "layers" },
  { title: "features.operator.title", description: "features.operator.desc", icon: "space_dashboard" },
  { title: "features.analytics.title", description: "features.analytics.desc", icon: "monitoring" }
];

export function FeatureCards() {
  const { language, t } = useI18n();

  return (
    <section className="space-y-8">
      <div className="max-w-3xl">
        <p className="eyebrow">{language === "kk" ? "Платформа мүмкіндіктері" : "Возможности платформы"}</p>
        <h2 className="section-title mt-3">
          {language === "kk"
            ? "Артық шуылсыз қалалық диспетчерлеу құралдары"
            : "Инструменты для городской диспетчеризации без лишнего шума"}
        </h2>
        <p className="section-copy mt-4">
          {language === "kk"
            ? "Платформа өтініштерді жылдам талдауға, қайталанатын аймақтарды көруге және мәселені дұрыс қызметке жіберуге көмектеседі."
            : "Платформа помогает быстрее разбирать обращения, видеть повторяющиеся зоны и передавать проблему нужной службе."}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} asChild>
            <article className="soft-card p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-surfaceStrong text-brand-600">
                <MaterialIcon name={feature.icon} className="text-[20px]" />
              </div>
              <h3 className="mt-6 text-[20px] font-semibold tracking-[-0.02em] text-app-text">{t(feature.title)}</h3>
              <p className="mt-3 text-[15px] leading-7 text-app-textMuted">{t(feature.description)}</p>
            </article>
          </Card>
        ))}
      </div>
    </section>
  );
}
