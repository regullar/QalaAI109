import type { Complaint } from "@/types/complaint";

export type ComplaintCluster = {
  key: string;
  district: string;
  category: string;
  addressText: string;
  count: number;
  priority: Complaint["priority"];
  priorityCounts: Record<Complaint["priority"], number>;
  openCount: number;
  resolvedCount: number;
  importanceScore: number;
  latestCreatedAt: string;
  longitude: number | null;
  latitude: number | null;
  complaints: Complaint[];
};

const PRIORITY_RANK: Record<Complaint["priority"], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

const PRIORITY_WEIGHT: Record<Complaint["priority"], number> = {
  low: 0.22,
  medium: 0.46,
  high: 0.72,
  critical: 1
};

export function normalizeAddress(address: string | null | undefined) {
  if (!address) return "";
  return address
    .toLowerCase()
    .replace(/мкр|микрорайон|microdistrict|mkr|district|район/giu, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getClusterKey(complaint: Pick<Complaint, "district" | "category" | "address_text">) {
  const district = complaint.district || "Не определен";
  const category = complaint.category || "Другое";
  const address = normalizeAddress(complaint.address_text);
  return `${district}|${category}|${address || "na"}`;
}

function parseDateTimestamp(dateString: string) {
  const timestamp = Date.parse(dateString);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function pickHigherPriority(
  current: Complaint["priority"],
  next: Complaint["priority"]
): Complaint["priority"] {
  return PRIORITY_RANK[next] > PRIORITY_RANK[current] ? next : current;
}

function isResolvedComplaint(complaint: Complaint) {
  return complaint.status === "resolved";
}

function createPriorityCounts(priority: Complaint["priority"]): Record<Complaint["priority"], number> {
  return {
    low: priority === "low" ? 1 : 0,
    medium: priority === "medium" ? 1 : 0,
    high: priority === "high" ? 1 : 0,
    critical: priority === "critical" ? 1 : 0
  };
}

function calculateImportanceScore(cluster: Pick<ComplaintCluster, "complaints" | "count">) {
  if (cluster.count === 0) return 0;

  const unresolvedComplaints = cluster.complaints.filter((complaint) => !isResolvedComplaint(complaint));
  const weightedPriorityAverage =
    cluster.complaints.reduce((sum, complaint) => {
      const statusModifier = isResolvedComplaint(complaint) ? 0.3 : 1;
      return sum + PRIORITY_WEIGHT[complaint.priority] * statusModifier;
    }, 0) / cluster.count;

  const unresolvedRatio = unresolvedComplaints.length / cluster.count;
  const concentrationFactor = Math.min(1, Math.log2(cluster.count + 1) / Math.log2(7));

  return Math.round((weightedPriorityAverage * 0.58 + unresolvedRatio * 0.27 + concentrationFactor * 0.15) * 100);
}

export function buildComplaintClusters(complaints: Complaint[]) {
  const clusters = new Map<string, ComplaintCluster>();

  for (const complaint of complaints) {
    const key = getClusterKey(complaint);
    const existing = clusters.get(key);
    const longitude = complaint.longitude;
    const latitude = complaint.latitude;
    const resolved = isResolvedComplaint(complaint);

    if (!existing) {
      clusters.set(key, {
        key,
        district: complaint.district || "Не определен",
        category: complaint.category || "Другое",
        addressText: complaint.address_text || "",
        count: 1,
        priority: complaint.priority,
        priorityCounts: createPriorityCounts(complaint.priority),
        openCount: resolved ? 0 : 1,
        resolvedCount: resolved ? 1 : 0,
        importanceScore: resolved ? Math.round(PRIORITY_WEIGHT[complaint.priority] * 24) : Math.round(55 + PRIORITY_WEIGHT[complaint.priority] * 45),
        latestCreatedAt: complaint.created_at,
        longitude,
        latitude,
        complaints: [complaint]
      });
      continue;
    }

    existing.count += 1;
    existing.priority = pickHigherPriority(existing.priority, complaint.priority);
    existing.priorityCounts[complaint.priority] += 1;
    if (resolved) existing.resolvedCount += 1;
    else existing.openCount += 1;
    if (parseDateTimestamp(complaint.created_at) > parseDateTimestamp(existing.latestCreatedAt)) {
      existing.latestCreatedAt = complaint.created_at;
    }
    if (existing.longitude === null && longitude !== null) existing.longitude = longitude;
    if (existing.latitude === null && latitude !== null) existing.latitude = latitude;
    existing.complaints.push(complaint);
    existing.importanceScore = calculateImportanceScore(existing);
  }

  return Array.from(clusters.values()).sort((a, b) => {
    if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore;
    return b.count - a.count;
  });
}
