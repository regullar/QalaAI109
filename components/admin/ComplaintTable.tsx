"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES, DISTRICTS, PRIORITIES, STATUSES } from "@/lib/constants";
import { PRIORITY_TRANSLATION_KEYS, STATUS_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatCategory, formatDistrict } from "@/lib/i18n-options";
import { formatDateTime } from "@/lib/locale";
import type { ComplaintStatus, StatusLog } from "@/types/complaint";
import { CategoryBadge } from "./CategoryBadge";
import { ClusterBadge } from "./ClusterBadge";
import { ComplaintDetailsDrawer, type AdminComplaint } from "./ComplaintDetailsDrawer";
import { PriorityBadge } from "./PriorityBadge";

type ComplaintTableProps = {
  initialComplaints: AdminComplaint[];
  initialLogsByComplaintId: Record<string, StatusLog[]>;
};

type Filters = {
  district: string;
  category: string;
  status: string;
  priority: string;
  onlyHotClusters: boolean;
};

function matchesFilters(complaint: AdminComplaint, filters: Filters) {
  if (filters.district !== "all" && complaint.district !== filters.district) return false;
  if (filters.category !== "all" && complaint.category !== filters.category) return false;
  if (filters.status !== "all" && complaint.status !== filters.status) return false;
  if (filters.priority !== "all" && complaint.priority !== filters.priority) return false;
  if (filters.onlyHotClusters && complaint.cluster_count < 3) return false;
  return true;
}

export function ComplaintTable({ initialComplaints, initialLogsByComplaintId }: ComplaintTableProps) {
  const { language, t } = useI18n();
  const [complaints, setComplaints] = useState<AdminComplaint[]>(initialComplaints);
  const [logsByComplaintId, setLogsByComplaintId] =
    useState<Record<string, StatusLog[]>>(initialLogsByComplaintId);
  const [filters, setFilters] = useState<Filters>({
    district: "all",
    category: "all",
    status: "all",
    priority: "all",
    onlyHotClusters: false
  });
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredComplaints = useMemo(
    () => complaints.filter((item) => matchesFilters(item, filters)),
    [complaints, filters]
  );

  const selectedComplaint = useMemo(
    () => complaints.find((item) => item.id === selectedComplaintId) || null,
    [complaints, selectedComplaintId]
  );

  const dashboardStats = useMemo(() => {
    const total = complaints.length;
    const newCount = complaints.filter((item) => item.status === "new").length;
    const criticalCount = complaints.filter((item) => item.priority === "critical").length;
    const inProgressCount = complaints.filter((item) => item.status === "in_progress").length;
    const resolvedCount = complaints.filter((item) => item.status === "resolved").length;
    const clusters = new Set(complaints.map((item) => item.cluster_key)).size;

    return { total, newCount, criticalCount, inProgressCount, resolvedCount, clusters };
  }, [complaints]);

  const onStatusUpdated = async (
    complaintId: string,
    nextStatus: ComplaintStatus,
    comment: string | null
  ) => {
    setError(null);
    const response = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        comment
      })
    });

    const payload = (await response.json()) as {
      error?: string;
      complaint?: AdminComplaint;
      statusLog?: StatusLog;
      unchanged?: boolean;
    };

    if (!response.ok || !payload.complaint) {
      const message = payload.error || t("status.error");
      setError(message);
      throw new Error(message);
    }

    setComplaints((prev) =>
      prev.map((item) => (item.id === payload.complaint!.id ? { ...item, status: payload.complaint!.status } : item))
    );

    if (payload.statusLog) {
      setLogsByComplaintId((prev) => ({
        ...prev,
        [payload.statusLog!.complaint_id]: [...(prev[payload.statusLog!.complaint_id] || []), payload.statusLog!]
      }));
    }
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="soft-card p-5">
          <p className="eyebrow">{t("admin.total")}</p>
          <p className="mt-1 text-3xl font-bold text-app-text">{dashboardStats.total}</p>
        </Card>
        <Card className="soft-card p-5">
          <p className="eyebrow">{t("admin.new")}</p>
          <p className="mt-1 text-3xl font-bold text-app-text">{dashboardStats.newCount}</p>
        </Card>
        <Card className="soft-card p-5">
          <p className="eyebrow">{t("admin.critical")}</p>
          <p className="mt-1 text-3xl font-bold text-red-700">{dashboardStats.criticalCount}</p>
        </Card>
        <Card className="soft-card p-5">
          <p className="eyebrow">{t("admin.inProgress")}</p>
          <p className="mt-1 text-3xl font-bold text-orange-700">{dashboardStats.inProgressCount}</p>
        </Card>
        <Card className="soft-card p-5">
          <p className="eyebrow">{t("admin.clusters")}</p>
          <p className="mt-1 text-3xl font-bold text-app-text">{dashboardStats.clusters}</p>
        </Card>
        <Card className="soft-card p-5">
          <p className="eyebrow">{t("admin.resolved")}</p>
          <p className="mt-1 text-3xl font-bold text-green-700">{dashboardStats.resolvedCount}</p>
        </Card>
      </section>

      <Card asChild>
        <section className="soft-card p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,0.95fr)] xl:items-end">
          <label className="grid gap-1" htmlFor="admin-filter-district">
            <span className="eyebrow">{t("common.district")}</span>
            <select
              id="admin-filter-district"
              value={filters.district}
              onChange={(event) => setFilters((prev) => ({ ...prev, district: event.target.value }))}
              className="field"
            >
              <option value="all">{t("common.all")}</option>
              {DISTRICTS.map((item) => (
                <option key={item} value={item}>
                  {formatDistrict(item, language)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1" htmlFor="admin-filter-category">
            <span className="eyebrow">{t("common.category")}</span>
            <select
              id="admin-filter-category"
              value={filters.category}
              onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
              className="field"
            >
              <option value="all">{t("common.all")}</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {formatCategory(item, language)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1" htmlFor="admin-filter-status">
            <span className="eyebrow">{t("common.status")}</span>
            <select
              id="admin-filter-status"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="field"
            >
              <option value="all">{t("common.all")}</option>
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {t(STATUS_TRANSLATION_KEYS[item])}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1" htmlFor="admin-filter-priority">
            <span className="eyebrow">{t("common.priority")}</span>
            <select
              id="admin-filter-priority"
              value={filters.priority}
              onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
              className="field"
            >
              <option value="all">{t("common.all")}</option>
              {PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {t(PRIORITY_TRANSLATION_KEYS[item])}
                </option>
              ))}
            </select>
          </label>
          <label
            htmlFor="admin-filter-hot-clusters"
            className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3"
          >
            <Checkbox
              id="admin-filter-hot-clusters"
              checked={filters.onlyHotClusters}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({ ...prev, onlyHotClusters: checked === true }))
              }
              className="size-5 shrink-0 rounded-[var(--radius)] border-app-border data-checked:border-brand-600 data-checked:bg-brand-600"
            />
            <span className="text-sm font-semibold leading-5 text-app-text">
              {t("admin.hotOnly")}
            </span>
          </label>
        </div>
        </section>
      </Card>

      {error ? (
        <section className="rounded-[var(--radius)] border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] xl:items-start">
        <section className="overflow-hidden rounded-[var(--radius)] border border-app-border bg-white">
          <div className="max-h-[calc(100vh-8rem)] overflow-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-app-border bg-app-surfaceMuted text-xs uppercase text-app-textSoft">
                  <th className="sticky top-0 bg-app-surfaceMuted px-3 py-2">{t("admin.id")}</th>
                  <th className="sticky top-0 bg-app-surfaceMuted px-3 py-2">{t("admin.titleColumn")}</th>
                  <th className="sticky top-0 bg-app-surfaceMuted px-3 py-2">{t("common.district")}</th>
                  <th className="sticky top-0 bg-app-surfaceMuted px-3 py-2">{t("common.category")}</th>
                  <th className="sticky top-0 bg-app-surfaceMuted px-3 py-2">{t("common.priority")}</th>
                  <th className="sticky top-0 bg-app-surfaceMuted px-3 py-2">{t("common.status")}</th>
                  <th className="sticky top-0 bg-app-surfaceMuted px-3 py-2">{t("admin.clusters")}</th>
                  <th className="sticky top-0 bg-app-surfaceMuted px-3 py-2">{t("admin.created")}</th>
                  <th className="sticky top-0 bg-app-surfaceMuted px-3 py-2">{t("admin.action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-5 text-center text-sm text-slate-600">
                      {t("admin.noRows")}
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="border-b border-app-border align-top text-sm">
                      <td className="px-3 py-3 font-mono text-xs font-semibold text-app-text">{complaint.public_id}</td>
                      <td className="px-3 py-3 font-medium text-app-text">{complaint.title}</td>
                      <td className="px-3 py-3 text-app-textMuted">{formatDistrict(complaint.district, language)}</td>
                      <td className="px-3 py-2">
                        <CategoryBadge category={complaint.category} />
                      </td>
                      <td className="px-3 py-2">
                        <PriorityBadge priority={complaint.priority} />
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded-full bg-app-surfaceStrong px-2.5 py-1 text-xs font-semibold text-app-textMuted">
                          {t(STATUS_TRANSLATION_KEYS[complaint.status])}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <ClusterBadge count={complaint.cluster_count} />
                      </td>
                      <td className="px-3 py-3 text-app-textMuted">
                        {formatDateTime(complaint.created_at, language)}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant="unstyled"
                          size="unstyled"
                          type="button"
                          onClick={() => setSelectedComplaintId(complaint.id)}
                          className="rounded-full bg-app-surfaceStrong px-3 py-1.5 text-xs font-semibold text-app-text transition"
                        >
                          {t("admin.open")}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedComplaint ? (
          <ComplaintDetailsDrawer
            complaint={selectedComplaint}
            logs={logsByComplaintId[selectedComplaint.id] || []}
            onClose={() => setSelectedComplaintId(null)}
            onStatusUpdated={onStatusUpdated}
          />
        ) : (
          <Card asChild>
            <aside className="soft-card p-6 xl:sticky xl:top-24">
            <h3 className="text-base font-bold text-app-text">{t("admin.details")}</h3>
            <p className="mt-2 text-sm text-app-textMuted">
              {t("admin.detailsHint")}
            </p>
            </aside>
          </Card>
        )}
      </div>
    </div>
  );
}
