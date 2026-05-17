"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STATUS_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatDistrict } from "@/lib/i18n-options";
import { formatDateTime } from "@/lib/locale";
import type { Complaint, ComplaintStatus, StatusLog } from "@/types/complaint";
import { CategoryBadge } from "./CategoryBadge";
import { ClusterBadge } from "./ClusterBadge";
import { PriorityBadge } from "./PriorityBadge";
import { StatusSelect } from "./StatusSelect";

export type AdminComplaint = Complaint & {
  cluster_key: string;
  cluster_count: number;
  similar_public_ids: string[];
};

type ComplaintDetailsDrawerProps = {
  complaint: AdminComplaint | null;
  logs: StatusLog[];
  onClose: () => void;
  onStatusUpdated: (complaintId: string, nextStatus: ComplaintStatus, comment: string | null) => Promise<void>;
};

export function ComplaintDetailsDrawer({
  complaint,
  logs,
  onClose,
  onStatusUpdated
}: ComplaintDetailsDrawerProps) {
  const { language, t } = useI18n();

  if (!complaint) return null;

  const statusText = (status: ComplaintStatus) => t(STATUS_TRANSLATION_KEYS[status]);

  return (
    <Card asChild>
      <aside className="soft-card p-6 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold text-app-textMuted">{complaint.public_id}</p>
          <h2 className="text-lg font-bold text-app-text">{complaint.title}</h2>
        </div>
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          onClick={onClose}
          className="rounded-full bg-app-surfaceStrong px-3 py-1.5 text-xs font-semibold text-app-text transition"
        >
          {t("drawer.close")}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <PriorityBadge priority={complaint.priority} />
        <CategoryBadge category={complaint.category} />
        <ClusterBadge count={complaint.cluster_count} />
        <span className="inline-flex rounded-full bg-app-surfaceStrong px-2.5 py-1 text-xs font-semibold text-app-textMuted">
          {statusText(complaint.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-app-textMuted">
        <p>
          <span className="font-semibold text-app-text">{t("common.district")}:</span>{" "}
          {formatDistrict(complaint.district, language)}
        </p>
        <p>
          <span className="font-semibold text-app-text">{t("common.address")}:</span>{" "}
          {complaint.address_text || "-"}
        </p>
        <p>
          <span className="font-semibold text-app-text">{t("drawer.subcategory")}:</span>{" "}
          {complaint.subcategory || "-"}
        </p>
        <p>
          <span className="font-semibold text-app-text">{t("preview.service")}:</span>{" "}
          {complaint.responsible_service || "-"}
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted p-4">
        <p className="eyebrow">{t("drawer.raw")}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-app-text">{complaint.raw_text}</p>
      </div>

      {complaint.summary ? (
        <div className="mt-3 rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted p-4">
          <p className="eyebrow">{t("drawer.summary")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-app-text">{complaint.summary}</p>
        </div>
      ) : null}

      {complaint.risk_factors && complaint.risk_factors.length > 0 ? (
        <div className="mt-3">
          <p className="eyebrow">{t("preview.risks")}</p>
          <ul className="mt-1 list-inside list-disc text-sm text-app-textMuted">
            {complaint.risk_factors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {complaint.appeal_text ? (
        <div className="mt-3 rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted p-4">
          <p className="eyebrow">{t("drawer.official")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-app-text">{complaint.appeal_text}</p>
        </div>
      ) : null}

      <div className="mt-3 rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted p-4">
        <p className="eyebrow">{t("drawer.similar")}</p>
        {complaint.similar_public_ids.length === 0 ? (
          <p className="mt-1 text-sm text-app-textMuted">{t("drawer.noSimilar")}</p>
        ) : (
          <ul className="mt-1 list-inside list-disc text-sm text-app-textMuted">
            {complaint.similar_public_ids.slice(0, 8).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3">
        <StatusSelect
          complaintId={complaint.id}
          value={complaint.status}
          onUpdated={(nextStatus, comment) => onStatusUpdated(complaint.id, nextStatus, comment)}
        />
      </div>

      <div className="mt-3 rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted p-4">
        <p className="eyebrow">{t("drawer.timeline")}</p>
        {logs.length === 0 ? (
          <p className="mt-1 text-sm text-app-textMuted">{t("drawer.noTimeline")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="rounded-[var(--radius)] border border-app-border bg-white p-3">
                <p className="text-sm font-semibold text-app-text">
                  {log.old_status
                    ? `${statusText(log.old_status)} -> ${statusText(log.new_status)}`
                    : `${t("drawer.created")}: ${statusText(log.new_status)}`}
                </p>
                <p className="text-xs text-app-textMuted">{formatDateTime(log.created_at, language)}</p>
                {log.comment ? <p className="text-sm text-app-textMuted">{log.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      </aside>
    </Card>
  );
}
