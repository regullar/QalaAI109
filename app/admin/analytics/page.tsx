import { DistributionBars } from "@/components/analytics/DistributionBars";
import { HotClusters } from "@/components/analytics/HotClusters";
import { StatsCards } from "@/components/analytics/StatsCards";
import { TopCategories } from "@/components/analytics/TopCategories";
import { TopDistricts } from "@/components/analytics/TopDistricts";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { LocalizedValue } from "@/components/i18n/LocalizedValue";
import { Card } from "@/components/ui/card";
import { buildComplaintClusters } from "@/lib/cluster";
import { CATEGORIES, DISTRICTS, PRIORITIES, STATUSES } from "@/lib/constants";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { AnalyticsSummary } from "@/types/analytics";
import type { Complaint } from "@/types/complaint";

function buildSummary(complaints: Complaint[]): AnalyticsSummary {
  const total = complaints.length;
  const newCount = complaints.filter((item) => item.status === "new").length;
  const criticalCount = complaints.filter((item) => item.priority === "critical").length;
  const resolvedCount = complaints.filter((item) => item.status === "resolved").length;
  const resolvedPercentage = total > 0 ? Number(((resolvedCount / total) * 100).toFixed(2)) : 0;

  const categoryMap = new Map<string, number>();
  for (const category of CATEGORIES) categoryMap.set(category, 0);
  for (const complaint of complaints) {
    const key = complaint.category || "Другое";
    categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
  }

  const districtMap = new Map<string, number>();
  for (const district of DISTRICTS) districtMap.set(district, 0);
  for (const complaint of complaints) {
    const key = complaint.district || "Не определен";
    districtMap.set(key, (districtMap.get(key) || 0) + 1);
  }

  const topCategories = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
  const topDistricts = Array.from(districtMap.entries()).map(([district, count]) => ({ district, count })).sort((a, b) => b.count - a.count);

  const priorityDistribution = PRIORITIES.map((priority) => ({
    priority,
    count: complaints.filter((item) => item.priority === priority).length
  }));
  const statusDistribution = STATUSES.map((status) => ({
    status,
    count: complaints.filter((item) => item.status === status).length
  }));

  const clusters = buildComplaintClusters(complaints);
  const hotClusters = clusters.filter((item) => item.count >= 3).sort((a, b) => b.count - a.count);

  return {
    total,
    newCount,
    criticalCount,
    resolvedCount,
    resolvedPercentage,
    clustersCount: clusters.length,
    mostFrequentCategory: topCategories[0]?.category || null,
    mostActiveDistrict: topDistricts[0]?.district || null,
    topCategories,
    topDistricts,
    priorityDistribution,
    statusDistribution,
    hotClusters
  };
}

async function loadSummary(): Promise<{ summary: AnalyticsSummary | null; error: string | null }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { summary: null, error: "Supabase environment variables are not configured." };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(2000);

    if (error) return { summary: null, error: error.message };
    return { summary: buildSummary((data || []) as Complaint[]), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return { summary: null, error: message };
  }
}

export default async function AdminAnalyticsPage() {
  const { summary, error } = await loadSummary();

  return (
    <section className="section-wrap section-band space-y-8">
      <div className="max-w-4xl">
        <div>
          <p className="eyebrow">
            <LocalizedValue ru="Городская аналитика" kk="Қалалық талдау" />
          </p>
          <h1 className="display-title mt-3">
            <LocalizedText id="analytics.title" />
          </h1>
          <p className="section-copy mt-5 max-w-3xl">
            <LocalizedText id="analytics.copy" />
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-[var(--radius)] border border-[#F0C7CC] bg-[#FFF5F6] p-4 text-sm text-semantic-down">
          <LocalizedText id="analytics.loadFailed" />: {error}
        </div>
      ) : null}

      {summary ? (
        <>
          <StatsCards summary={summary} />
          <div className="grid gap-5 xl:grid-cols-3">
            <TopCategories data={summary.topCategories} />
            <TopDistricts data={summary.topDistricts} />
            <HotClusters data={summary.hotClusters} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <DistributionBars
              titleKey="analytics.priorityDistribution"
              kind="priority"
              data={summary.priorityDistribution.map((item) => ({
                label: item.priority,
                count: item.count
              }))}
            />
            <DistributionBars
              titleKey="analytics.statusDistribution"
              kind="status"
              data={summary.statusDistribution.map((item) => ({
                label: item.status,
                count: item.count
              }))}
            />
          </div>
        </>
      ) : !error ? (
        <Card asChild>
          <section className="soft-card-muted p-5 text-sm text-app-textMuted">
            <LocalizedText id="analytics.empty" />
          </section>
        </Card>
      ) : null}
    </section>
  );
}
