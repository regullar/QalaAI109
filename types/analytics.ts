import type { ComplaintPriority, ComplaintStatus } from "./complaint";

export type CountByCategory = {
  category: string;
  count: number;
};

export type CountByDistrict = {
  district: string;
  count: number;
};

export type PriorityDistributionItem = {
  priority: ComplaintPriority;
  count: number;
};

export type StatusDistributionItem = {
  status: ComplaintStatus;
  count: number;
};

export type HotCluster = {
  key: string;
  district: string;
  category: string;
  addressText: string;
  count: number;
  priority: ComplaintPriority;
  latestCreatedAt: string;
};

export type AnalyticsSummary = {
  total: number;
  newCount: number;
  criticalCount: number;
  resolvedCount: number;
  resolvedPercentage: number;
  clustersCount: number;
  mostFrequentCategory: string | null;
  mostActiveDistrict: string | null;
  topCategories: CountByCategory[];
  topDistricts: CountByDistrict[];
  priorityDistribution: PriorityDistributionItem[];
  statusDistribution: StatusDistributionItem[];
  hotClusters: HotCluster[];
};
