"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { STATUSES } from "@/lib/constants";
import { STATUS_TRANSLATION_KEYS, type TranslationKey } from "@/lib/i18n";
import type { ComplaintStatus } from "@/types/complaint";

type StatusSelectProps = {
  complaintId: string;
  value: ComplaintStatus;
  onUpdated: (nextStatus: ComplaintStatus, comment: string | null) => Promise<void>;
};

const quickActions: Array<{ status: ComplaintStatus; labelKey: TranslationKey; comment: string }> = [
  { status: "checking", labelKey: "status.checkingAction", comment: "Оператор взял обращение на проверку" },
  { status: "assigned", labelKey: "status.assignedAction", comment: "Передано ответственной службе" },
  { status: "in_progress", labelKey: "status.progressAction", comment: "Работы по обращению начаты" },
  { status: "resolved", labelKey: "status.resolvedAction", comment: "Обращение отмечено как решенное" },
  { status: "rejected", labelKey: "status.rejectedAction", comment: "Обращение отклонено оператором" }
];

export function StatusSelect({ complaintId, value, onUpdated }: StatusSelectProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<ComplaintStatus>(value);
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusId = `status-${complaintId}`;
  const commentId = `status-comment-${complaintId}`;

  const applyStatus = async (nextStatus: ComplaintStatus, nextComment: string | null) => {
    if (nextStatus === value && !nextComment) return;
    setIsSaving(true);
    setError(null);
    try {
      await onUpdated(nextStatus, nextComment);
      setStatus(nextStatus);
      setComment("");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : t("status.error");
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-[var(--radius)] border border-app-border bg-white p-4">
      <p className="eyebrow">{t("status.change")}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Button
            variant="unstyled"
            size="unstyled"
            key={action.status}
            type="button"
            onClick={() => applyStatus(action.status, action.comment)}
            disabled={isSaving || value === action.status}
            className="rounded-full bg-app-surfaceStrong px-3 py-1.5 text-xs font-semibold text-app-text transition disabled:cursor-not-allowed disabled:text-app-textSoft"
          >
            {t(action.labelKey)}
          </Button>
        ))}
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          id={statusId}
          value={status}
          onChange={(event) => setStatus(event.target.value as ComplaintStatus)}
          className="field"
          aria-label={`Status for complaint ${complaintId}`}
        >
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {t(STATUS_TRANSLATION_KEYS[item])}
            </option>
          ))}
        </select>

        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          onClick={() => applyStatus(status, comment.trim() || null)}
          disabled={isSaving}
          className="btn-primary min-h-12"
        >
          {isSaving ? t("status.saving") : t("status.apply")}
        </Button>
      </div>

      <label className="mt-2 grid gap-1" htmlFor={commentId}>
        <span className="eyebrow">{t("status.comment")}</span>
        <Input
          id={commentId}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="field"
          placeholder={t("status.commentPlaceholder")}
        />
      </label>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </Card>
  );
}
