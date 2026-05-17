"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildComplaintClusters, type ComplaintCluster } from "@/lib/cluster";
import { CATEGORIES, DISTRICTS, PRIORITIES, SHYMKENT_CENTER, STATUSES } from "@/lib/constants";
import { PRIORITY_TRANSLATION_KEYS, STATUS_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatCategory, formatDistrict } from "@/lib/i18n-options";
import type { Complaint } from "@/types/complaint";
import { ClusterPanel } from "./ClusterPanel";
import { MapFilters } from "./MapFilters";

type MapBounds = {
  southWest: [number, number];
  northEast: [number, number];
};

type AnimationOptions = {
  duration?: number;
  easing?: string;
  useHeightForAnimation?: boolean;
};

type MapInstance = {
  destroy: () => void;
  setCenter: (center: [number, number], options?: AnimationOptions) => void;
  setZoom: (zoom: number, options?: AnimationOptions) => void;
  fitBounds: (
    bounds: MapBounds,
    options?: {
      padding?: Partial<{ top: number; right: number; bottom: number; left: number }>;
      skipMapPadding?: boolean;
      considerRotation?: boolean;
      animation?: AnimationOptions;
      maxZoom?: number;
    }
  ) => void;
};

type MapObjectEventTarget = {
  on: (type: "click", listener: () => void) => void;
  destroy: () => void;
};

type MapObjectHandle = {
  destroy: () => void;
};

type MapGlApi = {
  Map: new (
    container: HTMLElement,
    options: {
      center: [number, number];
      zoom: number;
      key: string;
      zoomControl?: boolean | "topRight";
      controlsLayoutPadding?: Partial<{ top: number; right: number; bottom: number; left: number }>;
    }
  ) => MapInstance;
  HtmlMarker: new (
    map: MapInstance,
    options: {
      coordinates: [number, number];
      html: HTMLElement;
      anchor?: [number, number];
      interactive?: boolean;
      preventMapInteractions?: boolean;
      zIndex?: number;
    }
  ) => MapObjectHandle;
  CircleMarker: new (
    map: MapInstance,
    options: {
      coordinates: [number, number];
      zIndex?: number;
      color?: string;
      diameter?: number;
      strokeColor?: string;
      strokeWidth?: number;
      interactive?: boolean;
    }
  ) => MapObjectEventTarget;
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

type CameraMode = "overview" | "cluster" | "complaint";

const PRIORITY_COLORS: Record<Complaint["priority"], string> = {
  critical: "#ff453a",
  high: "#ff7a1a",
  medium: "#ffd60a",
  low: "#5ac8fa"
};

const RESOLVED_COLOR = "#34c759";
const DEFAULT_CITY_ZOOM = 12;
const COMPLAINT_FOCUS_ZOOM = 15.5;
const SINGLE_POINT_OVERVIEW_ZOOM = 13.5;

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
  marker.style.filter = isSelected
    ? "drop-shadow(0 16px 32px rgba(15, 23, 42, 0.3))"
    : "drop-shadow(0 10px 24px rgba(15, 23, 42, 0.2))";

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

function getPriorityLayerWeight(priority: Complaint["priority"]) {
  if (priority === "critical") return 40;
  if (priority === "high") return 28;
  if (priority === "medium") return 16;
  return 8;
}

function getComplaintDiameter(isSelected: boolean) {
  return isSelected ? 20 : 14;
}

function getCameraPadding() {
  if (typeof window === "undefined") {
    return { top: 32, right: 32, bottom: 32, left: 32 };
  }

  if (window.innerWidth < 768) {
    return { top: 24, right: 24, bottom: 24, left: 24 };
  }

  if (window.innerWidth < 1280) {
    return { top: 32, right: 32, bottom: 32, left: 32 };
  }

  return { top: 40, right: 40, bottom: 40, left: 40 };
}

function getControlPadding() {
  if (typeof window === "undefined") {
    return { top: 16, right: 16, bottom: 16, left: 16 };
  }

  if (window.innerWidth < 768) {
    return { top: 12, right: 12, bottom: 12, left: 12 };
  }

  return { top: 16, right: 16, bottom: 16, left: 16 };
}

function buildBounds(coordinates: [number, number][]) {
  if (coordinates.length === 0) return null;

  let minLng = coordinates[0][0];
  let maxLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return {
    southWest: [minLng, minLat] as [number, number],
    northEast: [maxLng, maxLat] as [number, number]
  };
}

function getClusterCoordinates(cluster: ComplaintCluster) {
  return cluster.complaints
    .map((complaint) => getComplaintCoords(complaint))
    .filter((coords): coords is [number, number] => coords !== null);
}

function focusOverview(map: MapInstance, complaints: Complaint[]) {
  const coordinates = complaints
    .map((complaint) => getComplaintCoords(complaint))
    .filter((coords): coords is [number, number] => coords !== null);

  if (coordinates.length === 0) {
    map.setCenter([SHYMKENT_CENTER.lng, SHYMKENT_CENTER.lat], { duration: 540, easing: "easeOutCubic" });
    map.setZoom(DEFAULT_CITY_ZOOM, { duration: 540, easing: "easeOutCubic", useHeightForAnimation: true });
    return;
  }

  if (coordinates.length === 1) {
    map.setCenter(coordinates[0], { duration: 520, easing: "easeOutCubic" });
    map.setZoom(SINGLE_POINT_OVERVIEW_ZOOM, {
      duration: 520,
      easing: "easeOutCubic",
      useHeightForAnimation: true
    });
    return;
  }

  const bounds = buildBounds(coordinates);
  if (!bounds) return;

  map.fitBounds(bounds, {
    padding: getCameraPadding(),
    maxZoom: 14.5,
    animation: { duration: 620, easing: "easeOutCubic" }
  });
}

function focusCluster(map: MapInstance, cluster: ComplaintCluster | null) {
  if (!cluster) return;

  const coordinates = getClusterCoordinates(cluster);
  if (coordinates.length === 0) return;

  if (coordinates.length === 1) {
    map.setCenter(coordinates[0], { duration: 520, easing: "easeOutCubic" });
    map.setZoom(14.5, { duration: 520, easing: "easeOutCubic", useHeightForAnimation: true });
    return;
  }

  const bounds = buildBounds(coordinates);
  if (!bounds) return;

  map.fitBounds(bounds, {
    padding: getCameraPadding(),
    maxZoom: 15,
    animation: { duration: 620, easing: "easeOutCubic" }
  });
}

function focusComplaint(map: MapInstance, complaint: Complaint | null) {
  const coordinates = complaint ? getComplaintCoords(complaint) : null;
  if (!coordinates) return;

  map.setCenter(coordinates, { duration: 480, easing: "easeOutCubic" });
  map.setZoom(COMPLAINT_FOCUS_ZOOM, {
    duration: 480,
    easing: "easeOutCubic",
    useHeightForAnimation: true
  });
}

function clearMapObjects(objectsRef: React.MutableRefObject<MapObjectHandle[]>) {
  for (const marker of objectsRef.current) marker.destroy();
  objectsRef.current = [];
}

function didDataFiltersChange(previous: FilterState | null, next: FilterState) {
  if (!previous) return false;
  return (
    previous.district !== next.district ||
    previous.category !== next.category ||
    previous.status !== next.status ||
    previous.priority !== next.priority
  );
}

function preventBrowserZoomOnMap(container: HTMLElement) {
  const handleWheel = (event: WheelEvent) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
  };

  container.addEventListener("wheel", handleWheel, { capture: true, passive: false });

  return () => {
    container.removeEventListener("wheel", handleWheel, { capture: true });
  };
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
  const [cameraMode, setCameraMode] = useState<CameraMode>("overview");
  const [isMapLoading, setIsMapLoading] = useState(hasMapKey);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const mapglRef = useRef<MapGlApi | null>(null);
  const objectsRef = useRef<MapObjectHandle[]>([]);
  const previousFilterRef = useRef<FilterState | null>(null);

  const filteredComplaints = useMemo(
    () => complaints.filter((complaint) => complaintMatchesFilter(complaint, filter)),
    [complaints, filter]
  );

  const clusters = useMemo(() => buildComplaintClusters(filteredComplaints), [filteredComplaints]);

  const clusterCountByComplaintId = useMemo(() => {
    const entries = new Map<string, number>();
    for (const cluster of clusters) {
      for (const complaint of cluster.complaints) {
        entries.set(complaint.id, cluster.count);
      }
    }
    return entries;
  }, [clusters]);

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

  const layeredPoints = useMemo(() => {
    const withLayer = points.map((point) => {
      const isSelected =
        point.kind === "cluster"
          ? point.cluster.key === selectedClusterKey
          : point.complaint.id === selectedComplaintId;

      const zIndex = (() => {
        if (isSelected) return 5000;

        if (point.kind === "cluster") {
          return 1000 + point.cluster.count * 20 + point.cluster.importanceScore;
        }

        const duplicateCount = clusterCountByComplaintId.get(point.complaint.id) || 1;
        return 100 + duplicateCount * 20 + getPriorityLayerWeight(point.complaint.priority);
      })();

      return { point, isSelected, zIndex };
    });

    return withLayer.sort((a, b) => a.zIndex - b.zIndex);
  }, [clusterCountByComplaintId, points, selectedClusterKey, selectedComplaintId]);

  const criticalClusters = clusters.filter((cluster) => cluster.importanceScore >= 72).length;
  const missingCoordsCount = filteredComplaints.filter((item) => !getComplaintCoords(item)).length;

  const cameraLabel =
    cameraMode === "cluster"
      ? t("map.cameraCluster")
      : cameraMode === "complaint"
        ? t("map.cameraComplaint")
        : t("map.cameraOverview");

  const handleSelectCluster = useCallback((clusterKey: string) => {
    const cluster = clusters.find((item) => item.key === clusterKey) || null;
    setSelectedClusterKey(clusterKey);
    setSelectedComplaintId(cluster?.complaints[0]?.id || null);
    setFilter((prev) => ({ ...prev, clusterMode: true }));
    setCameraMode("cluster");
  }, [clusters]);

  const handleSelectComplaint = useCallback((complaintId: string) => {
    setSelectedClusterKey(null);
    setSelectedComplaintId(complaintId);
    setCameraMode("complaint");
  }, []);

  const handleResetView = () => {
    setSelectedClusterKey(null);
    setSelectedComplaintId(null);
    setCameraMode("overview");
  };

  const handleFilterChange = (next: FilterState) => {
    const filtersChanged = didDataFiltersChange(previousFilterRef.current, next);
    previousFilterRef.current = next;
    setFilter(next);

    if (filtersChanged) {
      setSelectedClusterKey(null);
      setSelectedComplaintId(null);
      setCameraMode("overview");
      return;
    }

    if (next.clusterMode !== filter.clusterMode) {
      if (!next.clusterMode && selectedComplaintId) {
        setCameraMode("complaint");
      } else if (next.clusterMode && selectedClusterKey) {
        setCameraMode("cluster");
      }
    }
  };

  useEffect(() => {
    if (!selectedComplaintId && !selectedClusterKey) return;

    const selectedComplaintStillVisible = selectedComplaintId
      ? filteredComplaints.some((item) => item.id === selectedComplaintId)
      : true;
    const selectedClusterStillVisible = selectedClusterKey
      ? clusters.some((item) => item.key === selectedClusterKey)
      : true;

    if (selectedComplaintStillVisible && selectedClusterStillVisible) return;

    setSelectedComplaintId(null);
    setSelectedClusterKey(null);
    setCameraMode("overview");
  }, [clusters, filteredComplaints, selectedClusterKey, selectedComplaintId]);

  useEffect(() => {
    if (!containerRef.current) return;
    return preventBrowserZoomOnMap(containerRef.current);
  }, []);

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
          zoom: DEFAULT_CITY_ZOOM,
          key,
          zoomControl: true,
          controlsLayoutPadding: getControlPadding()
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
      clearMapObjects(objectsRef);
      mapRef.current?.destroy();
      mapRef.current = null;
      mapglRef.current = null;
      setMapReady(false);
      setIsMapLoading(false);
    };
  }, [hasMapKey, key, t]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (cameraMode === "cluster" && filter.clusterMode && selectedCluster) {
      focusCluster(mapRef.current, selectedCluster);
      return;
    }

    if (cameraMode === "complaint" && selectedComplaint) {
      focusComplaint(mapRef.current, selectedComplaint);
      return;
    }

    focusOverview(mapRef.current, filteredComplaints);
  }, [cameraMode, filter.clusterMode, filteredComplaints, mapReady, selectedCluster, selectedComplaint]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapglRef.current) return;

    clearMapObjects(objectsRef);

    for (const { point, isSelected, zIndex } of layeredPoints) {
      if (point.kind === "cluster") {
        const html = createClusterMarker(
          getPointColor(point),
          String(point.cluster.count),
          point.cluster.count,
          isSelected
        );
        html.style.position = "relative";
        html.style.zIndex = String(zIndex);
        html.addEventListener("click", () => {
          handleSelectCluster(point.cluster.key);
        });

        const size = Math.min(64, 42 + Math.max(0, point.cluster.count - 1) * 3);
        const marker = new mapglRef.current.HtmlMarker(mapRef.current, {
          coordinates: [point.longitude, point.latitude],
          html,
          anchor: [size / 2, size / 2],
          interactive: true,
          preventMapInteractions: true,
          zIndex
        });

        objectsRef.current.push(marker);
        continue;
      }

      const marker = new mapglRef.current.CircleMarker(mapRef.current, {
        coordinates: [point.longitude, point.latitude],
        zIndex,
        color: getPointColor(point),
        diameter: getComplaintDiameter(isSelected),
        strokeColor: isSelected ? "#ffffff" : "rgba(255,255,255,0.94)",
        strokeWidth: isSelected ? 4 : 3,
        interactive: true
      });

      marker.on("click", () => {
        handleSelectComplaint(point.complaint.id);
      });
      objectsRef.current.push(marker);
    }
  }, [handleSelectCluster, handleSelectComplaint, layeredPoints, mapReady]);

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-hidden">
      <MapFilters
        values={filter}
        districts={[...DISTRICTS]}
        categories={[...CATEGORIES]}
        statuses={[...STATUSES]}
        priorities={[...PRIORITIES]}
        onChange={handleFilterChange}
      />

      {!hasMapKey ? (
        <div className="rounded-[var(--radius)] border border-[#F0DFC2] bg-[#FFF8EA] p-4 text-sm text-[#8A5A00]">
          {t("map.noKey")}
        </div>
      ) : null}

      {hasMapKey && isMapLoading ? (
        <Card className="soft-card-muted p-4 text-sm text-app-textMuted">{t("map.loading")}</Card>
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
        <Card className="soft-card-muted p-4 text-sm text-app-textMuted">{t("map.empty")}</Card>
      ) : null}

      <div className="grid min-w-0 max-w-full gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-4">
          <Card className="soft-card relative z-0 isolate min-w-0 max-w-full overflow-hidden p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-app-surfaceStrong px-3 py-1 text-xs font-semibold text-app-text">
                {filter.clusterMode ? t("map.clustersOn") : t("map.clustersOff")}
              </span>
              <span className="rounded-full bg-app-dark px-3 py-1 text-xs font-semibold text-white">
                {criticalClusters}
              </span>
              <span className="rounded-full bg-app-surfaceMuted px-3 py-1 text-xs font-semibold text-app-textMuted">
                {cameraLabel}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleResetView}
                className="rounded-full px-3"
              >
                {t("map.showAll")}
              </Button>
            </div>

            <div
              ref={containerRef}
              className="relative z-0 h-[340px] w-full min-w-0 max-w-full overflow-hidden rounded-[var(--radius)] border border-app-border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(247,247,247,1)_42%,_rgba(238,240,243,1)_100%)] [overscroll-behavior:contain] sm:h-[420px] lg:h-[520px] xl:h-[560px]"
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
            <section className="soft-card rounded-[var(--radius)] p-4 sm:p-6">
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
                    {formatDistrict(selectedComplaint.district, language)} |{" "}
                    {formatCategory(selectedComplaint.category, language)}
                  </p>
                  <p className="text-app-textMuted">{selectedComplaint.address_text || t("common.addressMissing")}</p>
                  {selectedCluster ? (
                    <div className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.04em] text-app-textMuted">
                        {t("map.hotZone")}
                      </p>
                      <p className="mt-1 text-sm text-app-text">
                        {selectedCluster.count} {t("map.count")} | {selectedCluster.openCount} /{" "}
                        {selectedCluster.resolvedCount}
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

        <section className="min-w-0 space-y-4">
          <ClusterPanel
            clusters={clusters}
            selectedClusterKey={selectedClusterKey}
            onSelect={handleSelectCluster}
          />

          <Card asChild>
            <section className="soft-card rounded-[var(--radius)] p-4 sm:p-6">
              <h3 className="text-base font-bold text-app-text">{t("map.summary")}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3">
                  <p className="break-words text-[11px] font-semibold uppercase leading-snug tracking-[0.04em] text-app-textMuted">
                    {t("map.filtered")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-app-text">{filteredComplaints.length}</p>
                </div>
                <div className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3">
                  <p className="break-words text-[11px] font-semibold uppercase leading-snug tracking-[0.04em] text-app-textMuted">
                    {t("map.points")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-app-text">{points.length}</p>
                </div>
                <div className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3">
                  <p className="break-words text-[11px] font-semibold uppercase leading-snug tracking-[0.04em] text-app-textMuted">
                    {t("map.missingCoords")}
                  </p>
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
