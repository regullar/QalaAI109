"use client";

import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import { PRIORITY_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatCategory, formatDistrict } from "@/lib/i18n-options";
import type { AnalyzeComplaintResponse } from "@/types/complaint";
import { EmergencyWarning } from "./EmergencyWarning";

type AiPreviewCardProps = {
  data: AnalyzeComplaintResponse;
};

export function AiPreviewCard({ data }: AiPreviewCardProps) {
  const { language, t } = useI18n();
  const confidencePct = Math.round(data.confidence * 100);

  return (
    <Card asChild>
      <section className="dark-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/90">
            <Sparkles size={13} strokeWidth={2} />
            {language === "kk" ? "AI-талдау" : "AI-анализ"}
          </p>
          <h2 className="mt-4 text-[24px] font-normal tracking-[-0.03em] text-white">{data.title}</h2>
          <p className="mt-3 text-[15px] leading-7 text-white/82">{data.summary}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white">
          {t(PRIORITY_TRANSLATION_KEYS[data.priority])}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius)] bg-white/5 p-4">
          <p className="eyebrow text-white/72">{t("common.category")}</p>
          <p className="mt-2 text-[15px] font-semibold text-white">
            {formatCategory(data.category, language)} / {data.subcategory}
          </p>
        </div>
        <div className="rounded-[var(--radius)] bg-white/5 p-4">
          <p className="eyebrow text-white/72">{t("common.district")}</p>
          <p className="mt-2 text-[15px] font-semibold text-white">{formatDistrict(data.district, language)}</p>
        </div>
        <div className="rounded-[var(--radius)] bg-white/5 p-4">
          <p className="eyebrow text-white/72">{t("preview.service")}</p>
          <p className="mt-2 text-[15px] font-semibold text-white">{data.responsibleService}</p>
        </div>
        <div className="rounded-[var(--radius)] bg-white/5 p-4">
          <p className="eyebrow text-white/72">{t("preview.confidence")}</p>
          <p className="number-display mt-2 text-white">{confidencePct}%</p>
          {confidencePct < 60 ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#FFD08A]">
              <AlertTriangle size={13} strokeWidth={2} />
              {t("preview.review")}
            </p>
          ) : (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#7FE0AE]">
              <Check size={13} strokeWidth={2} />
              {t("preview.ready")}
            </p>
          )}
        </div>
      </div>

      {data.riskFactors.length > 0 ? (
        <div className="mt-6">
          <p className="eyebrow text-white/72">{t("preview.risks")}</p>
          <ul className="mt-3 space-y-2">
            {data.riskFactors.map((item) => (
              <li key={item} className="rounded-[var(--radius)] bg-white/6 px-4 py-3 text-sm text-white/84">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 rounded-[var(--radius)] border border-white/10 bg-black/10 p-5">
        <p className="eyebrow text-white/72">{t("preview.appeal")}</p>
        <p className="mt-3 text-sm leading-7 text-white/86">{data.appealText}</p>
      </div>

      {data.needsEmergencyWarning ? (
        <div className="mt-4">
          <EmergencyWarning className="border-[#5B1D1D] bg-[#2A1010] text-[#FFD7D7]" />
        </div>
      ) : null}
      </section>
    </Card>
  );
}
