"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { PRIORITY_TRANSLATION_KEYS, STATUS_TRANSLATION_KEYS } from "@/lib/i18n";

export function Hero() {
  const { language, t } = useI18n();
  const isKazakh = language === "kk";

  return (
    <section className="bg-app-dark px-4 pb-8 pt-6 text-white sm:px-6 lg:px-8 lg:pb-14 lg:pt-10">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[var(--radius)] border border-white/10 bg-app-dark px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-white/72">
              {isKazakh ? "Қалалық AI-диспетчер" : "AI-диспетчер города"}
            </p>
            <h1 className="display-title-dark mt-5 max-w-4xl">{t("hero.title")}</h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-white/82 sm:text-[18px] sm:leading-8">{t("hero.copy")}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="unstyled" size="unstyled" className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-4 text-[16px] font-semibold text-white sm:w-auto sm:px-8">
                <Link href="/report">
                  {t("hero.report")}
                  <MaterialIcon name="arrow_forward" className="text-[16px]" />
                </Link>
              </Button>
              <Button asChild variant="unstyled" size="unstyled" className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[16px] font-semibold text-white sm:w-auto">
                <Link href="/map">{t("hero.map")}</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Card className="dark-card p-4 sm:p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/72">
                  {isKazakh ? "Өтініш қабылдау" : "Прием обращений"}
                </p>
                <p className="mt-3 text-[28px] font-normal tracking-[-0.03em] text-white">24/7</p>
              </Card>
              <Card className="dark-card p-4 sm:p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/72">
                  {isKazakh ? "Басымдық деңгейлері" : "Уровни приоритета"}
                </p>
                <p className="mt-3 text-[28px] font-normal tracking-[-0.03em] text-white">
                  {isKazakh ? "5 деңгей" : "5 уровней"}
                </p>
              </Card>
              <Card className="dark-card p-4 sm:p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/72">
                  {isKazakh ? "Қайталанатын аймақтар" : "Повторяющиеся зоны"}
                </p>
                <p className="mt-3 text-[28px] font-normal tracking-[-0.03em] text-white">
                  {isKazakh ? "Бүкіл қала" : "По всему городу"}
                </p>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 lg:relative lg:min-h-[420px]">
            <Card className="dark-card p-5 shadow-[0_28px_60px_rgba(0,0,0,0.32)] lg:absolute lg:inset-x-0 lg:top-0 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/72">
                    {isKazakh ? "Оператор көрінісі" : "Экран оператора"}
                  </p>
                  <p className="mt-3 text-[28px] font-normal leading-[1.05] tracking-[-0.03em] text-white">
                    {t("hero.killerTitle")}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/88">
                  {isKazakh ? "AI бағыттады" : "AI направил"}
                </span>
              </div>
              <p className="mt-4 text-[15px] leading-7 text-white/82">{t("hero.killer")}</p>

              <div className="mt-5 rounded-[var(--radius)] border border-white/10 bg-black/10 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-white">
                      {isKazakh ? "Мектеп жанында шамдар жанбайды" : "Не горят фонари у школы"}
                    </p>
                    <p className="mt-1 text-[13px] text-white/72">
                      {isKazakh
                        ? "Нұрсат ш/а, коммуналдық қызметке жіберілді"
                        : "мкр Нурсат, передано в коммунальную службу"}
                    </p>
                  </div>
                  <p className="number-display text-white">94%</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[var(--radius)] bg-white/5 p-4">
                    <p className="text-[12px] uppercase tracking-[0.08em] text-white/72">{t("common.priority")}</p>
                    <p className="mt-2 text-[15px] font-semibold text-white">{t(PRIORITY_TRANSLATION_KEYS.critical)}</p>
                  </div>
                  <div className="rounded-[var(--radius)] bg-white/5 p-4">
                    <p className="text-[12px] uppercase tracking-[0.08em] text-white/72">{t("common.status")}</p>
                    <p className="mt-2 text-[15px] font-semibold text-white">{t(STATUS_TRANSLATION_KEYS.assigned)}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="dark-card p-5 shadow-[0_22px_50px_rgba(0,0,0,0.28)] lg:absolute lg:bottom-0 lg:right-0 lg:w-[82%] lg:-rotate-[5deg]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/72">
                {isKazakh ? "Кластер картасы" : "Карта кластера"}
              </p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[22px] font-normal tracking-[-0.03em] text-white">
                    {isKazakh ? "5 нақты проблемалық аймақ" : "5 реальных проблемных зон"}
                  </p>
                  <p className="mt-2 text-[14px] leading-6 text-white/76">
                    {isKazakh
                      ? "Қайталанатын шағымдар түсінікті қалалық ыстық аймақтарға біріктіріледі."
                      : "Повторные жалобы собираются в понятные горячие зоны города."}
                  </p>
                </div>
                <div className="rounded-full bg-brand-600 px-4 py-2 text-[14px] font-semibold text-white">05</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
