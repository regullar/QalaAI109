import type { ComplaintPriority } from "@/types/complaint";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { PRIORITY_TRANSLATION_KEYS } from "@/lib/i18n";

type PriorityBadgeProps = {
  priority: ComplaintPriority;
};

const STYLE_BY_PRIORITY: Record<ComplaintPriority, string> = {
  critical: "bg-[#FFF5F6] text-semantic-down",
  high: "bg-[#FFF1E8] text-[#C25A00]",
  medium: "bg-[#FFF8E1] text-[#8A5A00]",
  low: "bg-app-surfaceStrong text-app-textMuted"
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { t } = useI18n();

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE_BY_PRIORITY[priority]}`}>
      {t(PRIORITY_TRANSLATION_KEYS[priority])}
    </span>
  );
}
