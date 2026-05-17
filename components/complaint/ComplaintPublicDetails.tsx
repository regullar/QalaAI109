"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRIORITY_TRANSLATION_KEYS, STATUS_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatCategory, formatDistrict, formatSource } from "@/lib/i18n-options";
import { formatDateTime } from "@/lib/locale";
import type { Complaint, StatusLog } from "@/types/complaint";

type ComplaintPublicDetailsProps = {
  complaint: Complaint;
  logs: StatusLog[];
};

export function ComplaintPublicDetails({ complaint, logs }: ComplaintPublicDetailsProps) {
  const { language, t } = useI18n();

  return (
    <div className="space-y-5">
      <Card asChild>
        <section className="page-panel">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold text-app-text">{complaint.public_id}</h1>
          <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {t(STATUS_TRANSLATION_KEYS[complaint.status])}
          </span>
          <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {t(PRIORITY_TRANSLATION_KEYS[complaint.priority])}
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-app-text">{complaint.title}</h2>
        {complaint.summary ? <p className="mt-2 max-w-4xl leading-7 text-app-textMuted">{complaint.summary}</p> : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Info label={t("common.category")}>
            {formatCategory(complaint.category, language)}
            {complaint.subcategory ? ` / ${complaint.subcategory}` : ""}
          </Info>
          <Info label={t("common.district")}>{formatDistrict(complaint.district, language)}</Info>
          <Info label={t("common.address")}>{complaint.address_text || "-"}</Info>
          <Info label={t("common.source")}>{formatSource(complaint.source, language)}</Info>
          <Info label={t("preview.service")}>{complaint.responsible_service || "-"}</Info>
          <Info label={t("preview.confidence")}>
            {complaint.ai_confidence !== null ? `${Math.round(complaint.ai_confidence * 100)}%` : "-"}
          </Info>
        </div>

        <TextBlock label={t("complaint.original")} value={complaint.raw_text} />
        {complaint.appeal_text ? <TextBlock label={t("complaint.generatedAppeal")} value={complaint.appeal_text} /> : null}

        {complaint.risk_factors && complaint.risk_factors.length > 0 ? (
          <div className="mt-4">
            <p className="eyebrow">{t("preview.risks")}</p>
            <ul className="mt-1 list-inside list-disc text-sm text-app-textMuted">
              {complaint.risk_factors.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <ActionLink href="/map">{t("complaint.openMap")}</ActionLink>
          <ActionLink href="/admin">{t("complaint.openAdmin")}</ActionLink>
          <ActionLink href="/admin/analytics">{t("complaint.openAnalytics")}</ActionLink>
        </div>
        </section>
      </Card>

      <Card asChild>
        <section className="soft-card p-6">
        <h3 className="text-lg font-bold text-app-text">{t("drawer.timeline")}</h3>
        {logs.length === 0 ? (
          <p className="mt-2 text-sm text-app-textMuted">{t("drawer.noTimeline")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted/70 p-3">
                <p className="text-sm font-semibold text-app-text">
                  {log.old_status
                    ? `${t(STATUS_TRANSLATION_KEYS[log.old_status])} -> ${t(STATUS_TRANSLATION_KEYS[log.new_status])}`
                    : `${t("drawer.created")}: ${t(STATUS_TRANSLATION_KEYS[log.new_status])}`}
                </p>
                <p className="mt-1 text-xs text-app-textMuted">{formatDateTime(log.created_at, language)}</p>
                {log.comment ? <p className="mt-1 text-sm text-app-textMuted">{log.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
        </section>
      </Card>
    </div>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="text-sm font-semibold text-app-text">{children}</p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5 rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-app-text">{value}</p>
    </div>
  );
}

function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button asChild variant="unstyled" size="unstyled" className="btn-secondary min-h-10 px-3 py-1.5">
      <Link href={href}>{children}</Link>
    </Button>
  );
}
