"use client";

import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

type EmergencyWarningProps = {
  className?: string;
};

export function EmergencyWarning({ className }: EmergencyWarningProps) {
  const { t } = useI18n();

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800",
        className
      )}
    >
      <AlertTriangle size={15} strokeWidth={2} className="mt-1 shrink-0" />
      {t("preview.emergency")}
    </div>
  );
}
