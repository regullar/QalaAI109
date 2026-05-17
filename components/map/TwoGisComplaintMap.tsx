"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/card";
import { buildComplaintClusters, type ComplaintCluster } from "@/lib/cluster";
import { CATEGORIES, DISTRICTS, PRIORITIES, SHYMKENT_CENTER, STATUSES } from "@/lib/constants";
import { PRIORITY_TRANSLATION_KEYS, STATUS_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatCategory, formatDistrict } from "@/lib/i18n-options";
import type { Complaint } from "@/types/complaint";
import { ClusterPanel } from "./ClusterPanel";
import { MapFilters } from "./MapFilters";

type MapGlApi = {
  Map: new (
    container: HTMLElement,
    options: { center: [number, number]; zoom: number; key: string }
  ) => {
    destroy: () => void;
  };
  HtmlMarker: new (
    map: object,
    options: {
      coordinates: [number, number];
      html: HTMLElement;
      anchor?: [number, number];
      interactive?: boolean;
      preventMapInteractions?: boolean;
      zIndex?: number;
    }
  ) => {
    destroy?: () => void;
  };
};

type MapGlLoader = {
  load: () => Promise<MapGlApi>;
};

type MapPoint =
  | { kind: "complaint"; complaint: Complaint; longitude: number; latitude: number }
  | { kind: "cluster"; cluster: ComplaintCluster; longitude: number; latitude: number };

type TwoGisComplaintMapProps = {
  complaints: Complaint[];
  loadError: string | null;
};

type FilterState = {
  district: string;
  category: string;
  status: string;
  priority: string;
  clusterMode: boolean;
};

const PRIORITY_COLORS: Record<Complaint["priority"], string> = {
  critical: "#ff453a",
  high: "#ff7a1a",
  medium: "#ffd60a",
  low: "#5ac8fa"
};

const RESOLVED_COLOR = "#34c759";

function getComplaintCoords(complaint: Complaint): [number, number] | null {
  if (complaint.longitude === null || complaint.latitude === null) return null;
  return [complaint.longitude, complaint.latitude];
}

function complaintMatchesFilter(complaint: Complaint, filter: FilterState) {
  if (filter.district !== "all" && complaint.district !== filter.district) return false;
  if (filter.category !== "all" && complaint.category !== filter.category) return false;
  if (filter.status !== "all" && complaint.status !== filter.status) return false;
  if (filter.priority !== "all" && complaint.priority !== filter.priority) return false;
  return true;
}

function getClusterColor(score: number) {
  if (score >= 88) return "#b91c1c";
  if (score >= 74) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 42) return "#facc15";
  if (score >= 24) return "#38bdf8";
  return "#34c759";
}

function getPointColor(point: MapPoint) {
  if (point.kind === "complaint") {
    return point.complaint.status === "resolved" ? RESOLVED_COLOR : PRIORITY_COLORS[point.complaint.priority];
  }

  if (point.cluster.openCount === 0) return RESOLVED_COLOR;
  return getClusterColor(point.cluster.importanceScore);
}

function createComplaintMarker(color: string, isSelected: boolean) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.setAttribute("aria-label", "Complaint");
  marker.style.width = isSelected ? "32px" : "24px";
  marker.style.height = isSelected ? "32px" : "24px";
  marker.style.border = "0";
  marker.style.padding = "0";
  marker.style.borderRadius = "999px";
  marker.style.background = "transparent";
  marker.style.display = "grid";
  marker.style.placeItems = "center";
  marker.style.cursor = "pointer";
  marker.style.outline = "none";
  marker.style.transition = "transform 180ms ease, filter 180ms ease";
  marker.style.transform = isSelected ? "scale(1.08)" : "scale(1)";
  marker.style.filter = isSelected ? "drop-shadow(0 12px 28px rgba(15, 23, 42, 0.28))" : "drop-shadow(0 8px 20px rgba(15, 23, 42, 0.2))";

  const halo = document.createElement("span");
  halo.style.width = "100%";
  halo.style.height = "100%";
  halo.style.borderRadius = "999px";
  halo.style.display = "grid";
  halo.style.placeItems = "center";
  halo.style.background = `radial-gradient(circle, ${color}44 0%, ${color}20 54%, rgba(255,255,255,0) 74%)`;
  halo.style.backdropFilter = "blur(10px)";

  const shell = document.createElement("span");
  shell.style.width = isSelected ? "21px" : "17px";
  shell.style.height = isSelected ? "21px" : "17px";
  shell.style.borderRadius = "999px";
  shell.style.background = "rgba(255,255,255,0.94)";
  shell.style.border = "1px solid rgba(255,255,255,0.88)";
  shell.style.boxShadow = "0 6px 18px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255,255,255,0.85)";
  shell.style.display = "grid";
  shell.style.placeItems = "center";

  const dot = document.createElement("span");
  dot.style.width = isSelected ? "11px" : "9px";
  dot.style.height = isSelected ? "11px" : "9px";
  dot.style.borderRadius = "999px";
  dot.style.background = `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`;
  dot.style.boxShadow = `0 0 0 1px ${color}22, 0 4px 10px ${color}55`;

  shell.appendChild(dot);
  halo.appendChild(shell);
  marker.appendChild(halo);
  return marker;
}

function createClusterMarker(color: string, label: string, count: number, isSelected: boolean) {
  const size = Math.min(64, 42 + Math.max(0, count - 1) * 3);

  const marker = document.createElement("button");
  marker.type = "button";
  marker.setAttribute("aria-label", `Cluster ${label}`);
  marker.style.width = `${size}px`;
  marker.style.height = `${size}px`;
  marker.style.border = "0";
  marker.style.padding = "0";
  marker.style.borderRadius = "999px";
  marker.style.background = "transparent";
  marker.style.display = "grid";
  marker.style.placeItems = "center";
  marker.style.cursor = "pointer";
  marker.style.outline = "none";
  marker.style.transform = isSelected ? "scale(1.06)" : "scale(1)";
  marker.style.transition = "transform 180ms ease, filter 180ms ease";
  marker.style.filter = isSelected ? "drop-shadow(0 16px 32px rgba(15, 23, 42, 0.3))" : "drop-shadow(0 10px 24px rgba(15, 23, 42, 0.2))";

  const halo = document.createElement("span");
  halo.style.width = "100%";
  halo.style.height = "100%";
  halo.style.borderRadius = "999px";
  halo.style.display = "grid";
  halo.style.placeItems = "center";
  halo.style.background = `radial-gradient(circle, ${color}52 0%, ${color}24 58%, rgba(255,255,255,0) 78%)`;

  const shell = document.createElement("span");
  shell.style.width = `${size - 10}px`;
  shell.style.height = `${size - 10}px`;
  shell.style.borderRadius = "999px";
  shell.style.display = "grid";
  shell.style.placeItems = "center";
  shell.style.background = `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`;
  shell.style.border = "1px solid rgba(255,255,255,0.78)";
  shell.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.24), 0 10px 24px rgba(15, 23, 42, 0.16)";
  shell.style.position = "relative";

  const inner = document.createElement("span");
  inner.style.width = `${size - 20}px`;
  inner.style.height = `${size - 20}px`;
  inner.style.borderRadius = "999px";
  inner.style.display = "grid";
  inner.style.placeItems = "center";
  inner.style.background = "rgba(255,255,255,0.18)";
  inner.style.backdropFilter = "blur(10px)";
  inner.style.color = "#ffffff";
  inner.style.fontSize = count >= 100 ? "12px" : "13px";
  inner.style.fontWeight = "700";
  inner.style.letterSpacing = "0";
  inner.textContent = label;

  shell.appendChild(inner);
  halo.appendChild(shell);
  marker.appendChild(halo);
  return marker;
}

function createMarkerElement(point: MapPoint, isSelected: boolean) {
  const color = getPointColor(point);
  if (point.kind === "cluster") {
    return createClusterMarker(color, String(point.cluster.count), point.cluster.count, isSelected);
  }
  return createComplaintMarker(color, isSelected);
}

export function TwoGisComplaintMap({ complaints, loadError }: TwoGisComplaintMapProps) {
  const { language, t } = useI18n();
  const key = process.env.NEXT_PUBLIC_2GIS_API_KEY || "";
  const hasMapKey = key.trim().length > 0;

  const [filter, setFilter] = useState<FilterState>({
    district: "all",
    category: "all",
    status: "all",
    priority: "all",
    clusterMode: true
  });
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(hasMapKey);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ destroy: () => void } | null>(null);
  const mapglRef = useRef<MapGlApi | null>(null);
  const markersRef = useRef<Array<{ destroy?: () => void }>>([]);

  const filteredComplaints = useMemo(
    () => complaints.filter((complaint) => complaintMatchesFilter(complaint, filter)),
    [complaints, filter]
  );

  const clusters = useMemo(() => buildComplaintClusters(filteredComplaints), [filteredComplaints]);

  const points = useMemo<MapPoint[]>(() => {
    if (filter.clusterMode) {
      return clusters.flatMap((cluster) => {
        if (cluster.longitude === null || cluster.latitude === null) return [];
        return [
          {
            kind: "cluster" as const,
            cluster,
            longitude: cluster.longitude,
            latitude: cluster.latitude
          }
        ];
      });
    }

    const complaintPoints: MapPoint[] = [];
    for (const complaint of filteredComplaints) {
      const coords = getComplaintCoords(complaint);
      if (!coords) continue;
      complaintPoints.push({
        kind: "complaint",
        complaint,
        longitude: coords[0],
        latitude: coords[1]
      });
    }
    return complaintPoints;
  }, [clusters, filter.clusterMode, filteredComplaints]);

  const selectedComplaint = useMemo(() => {
    if (selectedComplaintId) {
      return complaints.find((item) => item.id === selectedComplaintId) || null;
    }
    if (selectedClusterKey) {
      const cluster = clusters.find((item) => item.key === selectedClusterKey);
      return cluster?.complaints[0] || null;
    }
    return null;
  }, [clusters, complaints, selectedClusterKey, selectedComplaintId]);

  const selectedCluster = useMemo(
    () => (selectedClusterKey ? clusters.find((item) => item.key === selectedClusterKey) || null : null),
    [clusters, selectedClusterKey]
  );

  useEffect(() => {
    if (!hasMapKey || !containerRef.current) return;

    let isCancelled = false;
    setIsMapLoading(true);
    setMapLoadError(null);

    const initMap = async () => {
      try {
        const loader = (await import("@2gis/mapgl")) as unknown as MapGlLoader;
        const mapglApi = await loader.load();
        if (isCancelled || !containerRef.current) return;

        mapglRef.current = mapglApi;
        mapRef.current = new mapglApi.Map(containerRef.current, {
          center: [SHYMKENT_CENTER.lng, SHYMKENT_CENTER.lat],
          zoom: 12,
          key
        });
        setMapReady(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : t("map.loadFailed");
        if (!isCancelled) setMapLoadError(message);
      } finally {
        if (!isCancelled) setIsMapLoading(false);
      }
    };

    void initMap();

    return () => {
      isCancelled = true;
      for (const marker of markersRef.current) marker.destroy?.();
      markersRef.current = [];
      mapRef.current?.destroy();
      mapRef.current = null;
      mapglRef.current = null;
      setMapReady(false);
      setIsMapLoading(false);
    };
  }, [hasMapKey, key, t]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventPageScroll = (event: WheelEvent) => {
      event.preventDefault();
    };

    container.addEventListener("wheel", preventPageScroll, { passive: false });

    return () => {
      container.removeEventListener("wheel", preventPageScroll);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapglRef.current) return;

    for (const marker of markersRef.current) marker.destroy?.();
    markersRef.current = [];

    for (const point of points) {
      const isSelected =
        point.kind === "cluster" ? point.cluster.key === selectedClusterKey : point.complaint.id === selectedComplaintId;
      const html = createMarkerElement(point, isSelected);

      if (point.kind === "cluster") {
        html.addEventListener("click", () => {
          setSelectedClusterKey(point.cluster.key);
          setSelectedComplaintId(point.cluster.complaints[0]?.id || null);
        });
      } else {
        html.addEventListener("click", () => {
          setSelectedClusterKey(null);
          setSelectedComplaintId(point.complaint.id);
        });
      }

      const size = point.kind === "cluster" ? Math.min(64, 42 + Math.max(0, point.cluster.count - 1) * 3) : isSelected ? 32 : 24;
      const marker = new mapglRef.current.HtmlMarker(mapRef.current, {
        coordinates: [point.longitude, point.latitude],
        html,
        anchor: [size / 2, size / 2],
        interactive: true,
        preventMapInteractions: true,
        zIndex: isSelected ? 20 : point.kind === "cluster" ? 10 : 1
      });

      markersRef.current.push(marker);
    }
  }, [mapReady, points, selectedClusterKey, selectedComplaintId]);

  const missingCoordsCount = filteredComplaints.filter((item) => !getComplaintCoords(item)).length;
  const criticalClusters = clusters.filter((cluster) => cluster.importanceScore >= 72).length;

  return (
    <div className="space-y-4">
      <MapFilters
        values={filter}
        districts={[...DISTRICTS]}
        categories={[...CATEGORIES]}
        statuses={[...STATUSES]}
        priorities={[...PRIORITIES]}
        onChange={setFilter}
      />

      {!hasMapKey ? (
        <div className="rounded-[var(--radius)] border border-[#F0DFC2] bg-[#FFF8EA] p-4 text-sm text-[#8A5A00]">
          {t("map.noKey")}
        </div>
      ) : null}

      {hasMapKey && isMapLoading ? (
        <Card className="soft-card-muted p-4 text-sm text-app-textMuted">
          {t("map.loading")}
        </Card>
      ) : null}

      {mapLoadError ? (
        <div className="rounded-[var(--radius)] border border-[#F0C7CC] bg-[#FFF5F6] p-4 text-sm text-semantic-down">
          {t("map.loadFailed")}: {mapLoadError}
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-[var(--radius)] border border-[#F0C7CC] bg-[#FFF5F6] p-4 text-sm text-semantic-down">
          {t("map.dbFailed")}: {loadError}
        </div>
      ) : null}

      {!loadError && complaints.length === 0 ? (
        <Card className="soft-card-muted p-4 text-sm text-app-textMuted">
          {t("map.empty")}
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="space-y-4">
          <Card className="soft-card overflow-hidden p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-app-surfaceStrong px-3 py-1 text-xs font-semibold text-app-text">
                {filter.clusterMode ? t("map.clustersOn") : t("map.clustersOff")}
              </span>
              <span className="rounded-full bg-app-dark px-3 py-1 text-xs font-semibold text-white">
                {criticalClusters}
              </span>
            </div>
            <div
              ref={containerRef}
              className="h-[560px] w-full touch-none overflow-hidden rounded-[var(--radius)] border border-app-border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(247,247,247,1)_42%,_rgba(238,240,243,1)_100%)] [overscroll-behavior:contain]"
            >
              {!hasMapKey ? (
                <div className="flex h-full items-center justify-center p-4 text-center text-sm text-app-textMuted">
                  {t("map.canvasDisabled")}
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-app-textMuted">
              <span className="inline-flex items-center gap-2 rounded-full bg-app-surfaceStrong px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#34c759]" />
                {t(STATUS_TRANSLATION_KEYS.resolved)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-app-surfaceStrong px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" />
                {t(PRIORITY_TRANSLATION_KEYS.low)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-app-surfaceStrong px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#facc15]" />
                {t(PRIORITY_TRANSLATION_KEYS.medium)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-app-surfaceStrong px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                {t(PRIORITY_TRANSLATION_KEYS.high)}
              </span>
            </div>
          </Card>

          <Card asChild>
            <section className="soft-card rounded-[var(--radius)] p-6">
            <h2 className="text-base font-bold text-app-text">{t("map.selected")}</h2>
            {selectedComplaint ? (
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-app-surfaceStrong px-3 py-1 font-mono text-xs font-semibold text-app-text">
                    {selectedComplaint.public_id}
                  </span>
                    <span className="rounded-full bg-app-surfaceStrong px-3 py-1 text-xs text-app-textMuted">
                    {t(PRIORITY_TRANSLATION_KEYS[selectedComplaint.priority])}
                  </span>
                    <span className="rounded-full bg-app-surfaceStrong px-3 py-1 text-xs text-app-textMuted">
                    {t(STATUS_TRANSLATION_KEYS[selectedComplaint.status])}
                  </span>
                  {selectedCluster ? (
                    <span className="rounded-full bg-app-dark px-3 py-1 text-xs font-semibold text-white">
                      {selectedCluster.importanceScore}
                    </span>
                  ) : null}
                </div>
                <p className="text-base font-semibold text-app-text">{selectedComplaint.title}</p>
                <p className="text-app-textMuted">
                  {formatDistrict(selectedComplaint.district, language)} | {formatCategory(selectedComplaint.category, language)}
                </p>
                <p className="text-app-textMuted">{selectedComplaint.address_text || t("common.addressMissing")}</p>
                {selectedCluster ? (
                  <div className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-app-textMuted">{t("map.hotZone")}</p>
                    <p className="mt-1 text-sm text-app-text">
                      {selectedCluster.count} {t("map.count")} | {selectedCluster.openCount} / {selectedCluster.resolvedCount}
                    </p>
                  </div>
                ) : null}
                <p className="leading-6 text-app-text">{selectedComplaint.summary || selectedComplaint.raw_text}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-app-textMuted">{t("map.selectHint")}</p>
            )}
            </section>
          </Card>
        </section>

        <section className="space-y-4">
          <ClusterPanel
            clusters={clusters}
            selectedClusterKey={selectedClusterKey}
            onSelect={(clusterKey) => {
              setSelectedClusterKey(clusterKey);
              const cluster = clusters.find((item) => item.key === clusterKey);
              setSelectedComplaintId(cluster?.complaints[0]?.id || null);
              setFilter((prev) => ({ ...prev, clusterMode: true }));
            }}
          />

          <Card asChild>
            <section className="soft-card rounded-[var(--radius)] p-6">
            <h3 className="text-base font-bold text-app-text">{t("map.summary")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-app-textMuted">{t("map.filtered")}</p>
                <p className="mt-1 text-lg font-semibold text-app-text">{filteredComplaints.length}</p>
              </div>
              <div className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-app-textMuted">{t("map.points")}</p>
                <p className="mt-1 text-lg font-semibold text-app-text">{points.length}</p>
              </div>
              <div className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-app-textMuted">{t("map.missingCoords")}</p>
                <p className="mt-1 text-lg font-semibold text-app-text">{missingCoordsCount}</p>
              </div>
            </div>
            </section>
          </Card>
        </section>
      </div>
    </div>
  );
}
