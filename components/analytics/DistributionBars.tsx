"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import { PRIORITY_TRANSLATION_KEYS, STATUS_TRANSLATION_KEYS, type TranslationKey } from "@/lib/i18n";
import type { ComplaintPriority, ComplaintStatus } from "@/types/complaint";

type DistributionBarsProps<T extends string> = {
  titleKey: TranslationKey;
  data: Array<{ label: T; count: number }>;
  kind: "priority" | "status";
};

export function DistributionBars<T extends ComplaintPriority | ComplaintStatus>({
  titleKey,
  data,
  kind
}: DistributionBarsProps<T>) {
  const { t } = useI18n();
  const maxCount = Math.max(1, ...data.map((item) => item.count));
  const barColor = (label: T) => {
    if (kind === "priority") {
      const colors: Record<ComplaintPriority, string> = {
        critical: "#DC2626",
        high: "#F97316",
        medium: "#EAB308",
        low: "#64748B"
      };
      return colors[label as ComplaintPriority];
    }

    const colors: Record<ComplaintStatus, string> = {
      new: "#64748B",
      checking: "#D97706",
      assigned: "#2563EB",
      in_progress: "#EA580C",
      resolved: "#16A34A",
      rejected: "#DC2626"
    };
    return colors[label as ComplaintStatus];
  };

  const labelText = (label: T) => {
    if (kind === "priority") return t(PRIORITY_TRANSLATION_KEYS[label as ComplaintPriority]);
    return t(STATUS_TRANSLATION_KEYS[label as ComplaintStatus]);
  };

  return (
    <Card asChild>
      <section className="soft-card p-6">
      <h2 className="text-base font-bold text-app-text">{t(titleKey)}</h2>
      <ul className="mt-3 space-y-2">
        {data.map((item) => (
          <li key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-app-text">{labelText(item.label)}</span>
              <span className="text-app-textMuted">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-app-surfaceStrong">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.max(4, (item.count / maxCount) * 100)}%`,
                  backgroundColor: barColor(item.label)
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      </section>
    </Card>
  );
}
