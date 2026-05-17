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
    <section className="space-y-6 sm:space-y-8">
      <div className="max-w-3xl">
        <p className="eyebrow fade-up">{language === "kk" ? "Платформа мүмкіндіктері" : "Возможности платформы"}</p>
        <h2 className="section-title fade-up stagger-1 mt-3">
          {language === "kk"
            ? "Артық шуылсыз қалалық диспетчерлеу құралдары"
            : "Инструменты для городской диспетчеризации без лишнего шума"}
        </h2>
        <p className="section-copy fade-up stagger-2 mt-4">
          {language === "kk"
            ? "Платформа өтініштерді жылдам талдауға, қайталанатын аймақтарды көруге және мәселені дұрыс қызметке жіберуге көмектеседі."
            : "Платформа помогает быстрее разбирать обращения, видеть повторяющиеся зоны и передавать проблему нужной службе."}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={feature.title} asChild>
            <article
              className="group soft-card fade-up hover-lift hover-glow p-5 sm:p-8"
              style={{ animationDelay: `${120 + index * 55}ms` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-app-surfaceStrong text-brand-600 transition-transform duration-300 ease-[var(--motion-smooth)] group-hover:scale-105 sm:h-12 sm:w-12">
                <MaterialIcon name={feature.icon} className="text-[20px]" />
              </div>
              <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.02em] text-app-text sm:mt-6 sm:text-[20px]">{t(feature.title)}</h3>
              <p className="mt-3 text-[15px] leading-6 text-app-textMuted sm:leading-7">{t(feature.description)}</p>
            </article>
          </Card>
        ))}
      </div>
    </section>
  );
}
