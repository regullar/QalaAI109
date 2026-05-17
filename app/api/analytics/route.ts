import { buildComplaintClusters } from "@/lib/cluster";
import { PRIORITIES, STATUSES } from "@/lib/constants";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { AnalyticsSummary, CountByCategory, CountByDistrict, HotCluster } from "@/types/analytics";
import type { Complaint } from "@/types/complaint";

function toCountMap<T extends string>(values: T[]) {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value, (map.get(value) || 0) + 1);
  }
  return map;
}

function buildSummary(complaints: Complaint[]): AnalyticsSummary {
  const total = complaints.length;
  const newCount = complaints.filter((item) => item.status === "new").length;
  const criticalCount = complaints.filter((item) => item.priority === "critical").length;
  const resolvedCount = complaints.filter((item) => item.status === "resolved").length;
  const resolvedPercentage = total > 0 ? Number(((resolvedCount / total) * 100).toFixed(2)) : 0;

  const categoryCounts = toCountMap(complaints.map((item) => item.category || "Другое"));
  const districtCounts = toCountMap(complaints.map((item) => item.district || "Не определен"));
  const topCategories: CountByCategory[] = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  const topDistricts: CountByDistrict[] = Array.from(districtCounts.entries())
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count);

  const priorityDistribution = PRIORITIES.map((priority) => ({
    priority,
    count: complaints.filter((item) => item.priority === priority).length
  }));
  const statusDistribution = STATUSES.map((status) => ({
    status,
    count: complaints.filter((item) => item.status === status).length
  }));

  const clusters = buildComplaintClusters(complaints);
  const hotClusters = clusters
    .filter((cluster) => cluster.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map<HotCluster>((cluster) => ({
      key: cluster.key,
      district: cluster.district,
      category: cluster.category,
      addressText: cluster.addressText,
      count: cluster.count,
      priority: cluster.priority,
      latestCreatedAt: cluster.latestCreatedAt
    }));

  return {
    total,
    newCount,
    criticalCount,
    resolvedCount,
    resolvedPercentage,
    clustersCount: clusters.length,
    mostFrequentCategory: topCategories[0]?.category || null,
    mostActiveDistrict: topDistricts[0]?.district || null,
    topCategories: topCategories.slice(0, 10),
    topDistricts: topDistricts.slice(0, 10),
    priorityDistribution,
    statusDistribution,
    hotClusters
  };
}

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const district = url.searchParams.get("district");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const supabase = getSupabaseAdminClient();
    let query = supabase.from("complaints").select("*");

    if (district && district !== "all") query = query.eq("district", district);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error } = await query.order("created_at", { ascending: false }).limit(2000);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const complaints = (data || []) as Complaint[];
    const summary = buildSummary(complaints);
    return Response.json(summary, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
