import type { Complaint } from "@/types/complaint";
import {
  compareComplaintFingerprints,
  computeComplaintFingerprint,
  hasConfirmedDuplicateEdge,
  isPotentialDuplicateFingerprintCandidate,
  normalizeAddress
} from "./duplicates";

export { normalizeAddress };

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

function parseDateTimestamp(dateString: string) {
  const timestamp = Date.parse(dateString);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortByCreatedAt(complaints: Complaint[]) {
  return [...complaints].sort((left, right) => {
    const leftTs = parseDateTimestamp(left.created_at);
    const rightTs = parseDateTimestamp(right.created_at);
    if (leftTs !== rightTs) return leftTs - rightTs;
    return left.public_id.localeCompare(right.public_id);
  });
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

function buildStableClusterKey(complaints: Complaint[]) {
  const canonicalComplaint = sortByCreatedAt(complaints)[0];
  return `cluster:${canonicalComplaint.id}`;
}

function averageCoordinates(complaints: Complaint[]) {
  const points = complaints.filter(
    (complaint) => complaint.latitude !== null && complaint.longitude !== null
  );

  if (points.length === 0) {
    return { latitude: null, longitude: null };
  }

  const totals = points.reduce(
    (acc, complaint) => ({
      latitude: acc.latitude + (complaint.latitude || 0),
      longitude: acc.longitude + (complaint.longitude || 0)
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: Number((totals.latitude / points.length).toFixed(6)),
    longitude: Number((totals.longitude / points.length).toFixed(6))
  };
}

function pickClusterAddress(complaints: Complaint[]) {
  const sorted = sortByCreatedAt(complaints);
  return sorted.find((complaint) => complaint.address_text?.trim())?.address_text || "";
}

class UnionFind {
  private parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
  }

  find(index: number): number {
    if (this.parent[index] !== index) {
      this.parent[index] = this.find(this.parent[index]);
    }
    return this.parent[index];
  }

  union(left: number, right: number) {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot === rightRoot) return;
    this.parent[rightRoot] = leftRoot;
  }
}

export function getClusterKey(complaint: Pick<Complaint, "district" | "category" | "address_text">) {
  const fingerprint = computeComplaintFingerprint({
    district: complaint.district,
    category: complaint.category,
    subcategory: null,
    address_text: complaint.address_text,
    title: "",
    summary: "",
    raw_text: "",
    latitude: null,
    longitude: null,
    normalized_address: null,
    normalized_title: null,
    normalized_summary: null,
    normalized_text: null,
    duplicate_geo_bucket: null,
    duplicate_ai_hint: null
  });

  return `${fingerprint.district}|${fingerprint.category}|${fingerprint.normalizedAddress || "na"}`;
}

export function buildComplaintClusters(complaints: Complaint[]) {
  if (complaints.length === 0) return [];

  const orderedComplaints = sortByCreatedAt(complaints);
  const fingerprints = orderedComplaints.map((complaint) => computeComplaintFingerprint(complaint));
  const unionFind = new UnionFind(orderedComplaints.length);

  for (let leftIndex = 0; leftIndex < orderedComplaints.length; leftIndex += 1) {
    const leftComplaint = orderedComplaints[leftIndex];

    for (let rightIndex = leftIndex + 1; rightIndex < orderedComplaints.length; rightIndex += 1) {
      const rightComplaint = orderedComplaints[rightIndex];
      const leftFingerprint = fingerprints[leftIndex];
      const rightFingerprint = fingerprints[rightIndex];

      if (!isPotentialDuplicateFingerprintCandidate(leftFingerprint, rightFingerprint)) {
        const hasAiEdge =
          hasConfirmedDuplicateEdge(leftComplaint, rightComplaint.id) ||
          hasConfirmedDuplicateEdge(rightComplaint, leftComplaint.id);
        if (hasAiEdge) {
          unionFind.union(leftIndex, rightIndex);
        }
        continue;
      }

      const decision = compareComplaintFingerprints(leftFingerprint, rightFingerprint);
      const hasAiEdge =
        hasConfirmedDuplicateEdge(leftComplaint, rightComplaint.id) ||
        hasConfirmedDuplicateEdge(rightComplaint, leftComplaint.id);

      if (decision.decision === "match" || hasAiEdge) {
        unionFind.union(leftIndex, rightIndex);
      }
    }
  }

  const grouped = new Map<number, Complaint[]>();
  for (let index = 0; index < orderedComplaints.length; index += 1) {
    const root = unionFind.find(index);
    const current = grouped.get(root) || [];
    current.push(orderedComplaints[index]);
    grouped.set(root, current);
  }

  const clusters = Array.from(grouped.values()).map<ComplaintCluster>((group) => {
    const sortedGroup = sortByCreatedAt(group);
    const primary = sortedGroup[0];
    const coordinates = averageCoordinates(sortedGroup);
    const priorityCounts = createPriorityCounts(primary.priority);
    let clusterPriority = primary.priority;
    let openCount = 0;
    let resolvedCount = 0;
    let latestCreatedAt = primary.created_at;

    for (const complaint of sortedGroup) {
      if (complaint.id !== primary.id) {
        priorityCounts[complaint.priority] += 1;
        clusterPriority = pickHigherPriority(clusterPriority, complaint.priority);
      }

      if (isResolvedComplaint(complaint)) resolvedCount += 1;
      else openCount += 1;

      if (parseDateTimestamp(complaint.created_at) > parseDateTimestamp(latestCreatedAt)) {
        latestCreatedAt = complaint.created_at;
      }
    }

    const cluster: ComplaintCluster = {
      key: buildStableClusterKey(sortedGroup),
      district: primary.district || "Не определен",
      category: primary.category || "Другое",
      addressText: pickClusterAddress(sortedGroup),
      count: sortedGroup.length,
      priority: clusterPriority,
      priorityCounts,
      openCount,
      resolvedCount,
      importanceScore: 0,
      latestCreatedAt,
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
      complaints: sortedGroup
    };

    cluster.importanceScore = calculateImportanceScore(cluster);
    return cluster;
  });

  return clusters.sort((a, b) => {
    if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore;
    return b.count - a.count;
  });
}
