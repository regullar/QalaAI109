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

const PRIORITY_BADGE_STYLES: Record<AnalyzeComplaintResponse["priority"], string> = {
  low: "border-[#355C9B] bg-[#1A2740] text-[#D8E7FF]",
  medium: "border-[#8B6A17] bg-[#352807] text-[#FFE8A3]",
  high: "border-[#A85A17] bg-[#3D2006] text-[#FFD2A8]",
  critical: "border-[#8C2F39] bg-[#3A141A] text-[#FFD5DB]"
};

export function AiPreviewCard({ data }: AiPreviewCardProps) {
  const { language, t } = useI18n();
  const confidencePct = Math.round(data.confidence * 100);

  return (
    <Card asChild>
      <section className="dark-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-white">
            <Sparkles size={13} strokeWidth={2} />
            {language === "kk" ? "AI-талдау" : "AI-анализ"}
          </p>
          <h2 className="mt-4 text-[24px] font-normal tracking-[-0.03em] text-white">{data.title}</h2>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-7 text-white">
            {data.summary}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${PRIORITY_BADGE_STYLES[data.priority]}`}>
          {t(PRIORITY_TRANSLATION_KEYS[data.priority])}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-white/10 bg-white/9 p-4">
          <p className="eyebrow text-white/80">{t("common.category")}</p>
          <p className="mt-2 text-[15px] font-semibold text-white">
            {formatCategory(data.category, language)} / {data.subcategory}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-white/10 bg-white/9 p-4">
          <p className="eyebrow text-white/80">{t("common.district")}</p>
          <p className="mt-2 text-[15px] font-semibold text-white">{formatDistrict(data.district, language)}</p>
        </div>
        <div className="rounded-[var(--radius)] border border-white/10 bg-white/9 p-4">
          <p className="eyebrow text-white/80">{t("preview.service")}</p>
          <p className="mt-2 text-[15px] font-semibold text-white">{data.responsibleService}</p>
        </div>
        <div className="rounded-[var(--radius)] border border-white/10 bg-white/9 p-4">
          <p className="eyebrow text-white/80">{t("preview.confidence")}</p>
          <p className="number-display mt-2 text-white">{confidencePct}%</p>
          {confidencePct < 60 ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#FFD89E]">
              <AlertTriangle size={13} strokeWidth={2} />
              {t("preview.review")}
            </p>
          ) : (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#9AF0BC]">
              <Check size={13} strokeWidth={2} />
              {t("preview.ready")}
            </p>
          )}
        </div>
      </div>

      {data.riskFactors.length > 0 ? (
        <div className="mt-6">
          <p className="eyebrow text-white/80">{t("preview.risks")}</p>
          <ul className="mt-3 space-y-2">
            {data.riskFactors.map((item) => (
              <li key={item} className="rounded-[var(--radius)] border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 rounded-[var(--radius)] border border-white/18 bg-black/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <p className="eyebrow text-white/88">{t("preview.appeal")}</p>
        <p className="mt-3 rounded-[calc(var(--radius)-6px)] bg-white/[0.07] px-4 py-3 text-sm leading-7 text-white">
          {data.appealText}
        </p>
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
