"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRIORITY_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatCategory, formatDistrict } from "@/lib/i18n-options";
import type { ComplaintPriority } from "@/types/complaint";

type ClusterItem = {
  key: string;
  district: string;
  category: string;
  priority: string;
  count: number;
  openCount: number;
  resolvedCount: number;
  importanceScore: number;
  addressText: string;
  latestCreatedAt: string;
};

type ClusterPanelProps = {
  clusters: ClusterItem[];
  selectedClusterKey: string | null;
  onSelect: (clusterKey: string) => void;
};

function getClusterTone(score: number) {
  if (score >= 86) return "border-red-200 bg-red-50 text-red-700";
  if (score >= 72) return "border-orange-200 bg-orange-50 text-orange-700";
  if (score >= 56) return "border-amber-200 bg-amber-50 text-amber-700";
  if (score >= 40) return "border-yellow-200 bg-yellow-50 text-yellow-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

export function ClusterPanel({ clusters, selectedClusterKey, onSelect }: ClusterPanelProps) {
  const { language, t } = useI18n();
  const hotClusters = clusters.filter((cluster) => cluster.count >= 2);
  const openLabel = language === "kk" ? "Ашық" : "Открыто";

  return (
    <Card asChild>
      <aside className="soft-card min-w-0 max-w-full rounded-[var(--radius)] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-app-text">{t("map.hotZones")}</h2>
        <span className="rounded-full bg-app-surfaceStrong px-2.5 py-1 text-xs font-semibold text-app-text">
          {hotClusters.length}
        </span>
      </div>

      {hotClusters.length === 0 ? (
        <p className="mt-3 text-sm text-app-textMuted">{t("map.noHotZones")}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {hotClusters.map((cluster) => {
            const selected = selectedClusterKey === cluster.key;

            return (
              <li key={cluster.key}>
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  onClick={() => onSelect(cluster.key)}
                  className={`w-full rounded-[var(--radius)] border px-4 py-3 text-left transition active:scale-[0.99] ${
                    selected
                      ? "border-app-dark bg-app-dark text-white"
                      : "border-app-border bg-app-surfaceMuted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${selected ? "text-white" : "text-app-text"}`}>
                        {formatDistrict(cluster.district, language)} | {formatCategory(cluster.category, language)}
                      </p>
                      <p className={`mt-1 text-xs ${selected ? "text-slate-300" : "text-app-textMuted"}`}>
                        {cluster.addressText || t("common.addressMissing")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        selected ? "border-white/15 bg-white/10 text-white" : getClusterTone(cluster.importanceScore)
                      }`}
                    >
                      {cluster.importanceScore}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full border px-2.5 py-1 ${
                        selected ? "border-white/15 bg-white/10 text-slate-100" : "border-app-border bg-white text-app-textMuted"
                      }`}
                    >
                      {t("map.count")}: {cluster.count}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 ${
                        selected ? "border-white/15 bg-white/10 text-slate-100" : "border-app-border bg-white text-app-textMuted"
                      }`}
                    >
                      {openLabel}: {cluster.openCount}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 ${
                        selected ? "border-white/15 bg-white/10 text-slate-100" : "border-app-border bg-white text-app-textMuted"
                      }`}
                    >
                      {t("common.priority")}: {t(PRIORITY_TRANSLATION_KEYS[cluster.priority as ComplaintPriority])}
                    </span>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-app-surfaceStrong">
                    <div
                      className={`h-full rounded-full ${selected ? "bg-white/90" : "bg-slate-900"}`}
                      style={{ width: `${Math.max(8, cluster.importanceScore)}%` }}
                    />
                  </div>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      </aside>
    </Card>
  );
}
