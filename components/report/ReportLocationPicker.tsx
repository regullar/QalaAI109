"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, RotateCcw } from "lucide-react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DISTRICT_COORDINATES, SHYMKENT_CENTER } from "@/lib/constants";

type MapPoint = {
  latitude: number | null;
  longitude: number | null;
};

type ReportLocationPickerProps = {
  district: string;
  value: MapPoint;
  onChange: (value: MapPoint) => void;
};

type MapClickEvent = {
  lngLat: number[];
};

type MapGlApi = {
  Map: new (
    container: HTMLElement,
    options: {
      center: [number, number];
      zoom: number;
      key: string;
      lang?: string;
      zoomControl?: boolean;
      disableRotationByUserInteraction?: boolean;
      disablePitchByUserInteraction?: boolean;
    }
  ) => {
    destroy: () => void;
    setCenter: (center: [number, number], options?: { duration?: number }) => unknown;
    setZoom: (zoom: number, options?: { duration?: number }) => unknown;
    on: (type: "click", listener: (event: MapClickEvent) => void) => unknown;
    off: (type: "click", listener: (event: MapClickEvent) => void) => unknown;
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
    destroy: () => void;
    setCoordinates: (coordinates: [number, number]) => unknown;
  };
};

type MapGlLoader = {
  load: () => Promise<MapGlApi>;
};

function createLocationMarker() {
  const marker = document.createElement("div");
  marker.setAttribute("aria-label", "Selected report location");
  marker.style.width = "28px";
  marker.style.height = "28px";
  marker.style.display = "grid";
  marker.style.placeItems = "center";
  marker.style.pointerEvents = "none";

  const halo = document.createElement("span");
  halo.style.width = "28px";
  halo.style.height = "28px";
  halo.style.display = "grid";
  halo.style.placeItems = "center";
  halo.style.borderRadius = "999px";
  halo.style.background = "radial-gradient(circle, rgba(20, 184, 166, 0.35) 0%, rgba(20, 184, 166, 0.14) 55%, rgba(20, 184, 166, 0) 72%)";

  const pin = document.createElement("span");
  pin.style.width = "16px";
  pin.style.height = "16px";
  pin.style.borderRadius = "999px";
  pin.style.background = "linear-gradient(180deg, #14b8a6 0%, #0f766e 100%)";
  pin.style.border = "2px solid rgba(255,255,255,0.96)";
  pin.style.boxShadow = "0 10px 22px rgba(15, 23, 42, 0.22)";

  halo.appendChild(pin);
  marker.appendChild(halo);
  return marker;
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

export function ReportLocationPicker({ district, value, onChange }: ReportLocationPickerProps) {
  const { language, t } = useI18n();
  const key = process.env.NEXT_PUBLIC_2GIS_API_KEY || "";
  const hasMapKey = key.trim().length > 0;

  const [isMapLoading, setIsMapLoading] = useState(hasMapKey);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapglRef = useRef<MapGlApi | null>(null);
  const mapRef = useRef<InstanceType<MapGlApi["Map"]> | null>(null);
  const markerRef = useRef<InstanceType<MapGlApi["HtmlMarker"]> | null>(null);
  const clickHandlerRef = useRef<((event: MapClickEvent) => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const selectedCoordinatesRef = useRef<[number, number] | null>(null);
  const fallbackCenterRef = useRef<[number, number]>([SHYMKENT_CENTER.lng, SHYMKENT_CENTER.lat]);

  const selectedCoordinates = useMemo<[number, number] | null>(() => {
    if (value.latitude === null || value.longitude === null) return null;
    return [value.longitude, value.latitude];
  }, [value.latitude, value.longitude]);

  const fallbackCenter = useMemo<[number, number]>(() => {
    const districtPoint = DISTRICT_COORDINATES[district as keyof typeof DISTRICT_COORDINATES];
    if (districtPoint) return [districtPoint.longitude, districtPoint.latitude];
    return [SHYMKENT_CENTER.lng, SHYMKENT_CENTER.lat];
  }, [district]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    selectedCoordinatesRef.current = selectedCoordinates;
  }, [selectedCoordinates]);

  useEffect(() => {
    fallbackCenterRef.current = fallbackCenter;
  }, [fallbackCenter]);

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
        const initialCenter = selectedCoordinatesRef.current || fallbackCenterRef.current;
        const map = new mapglApi.Map(containerRef.current, {
          center: initialCenter,
          zoom: selectedCoordinatesRef.current ? 15 : 12,
          key,
          lang: language,
          zoomControl: true,
          disableRotationByUserInteraction: true,
          disablePitchByUserInteraction: true
        });

        const handleMapClick = (event: MapClickEvent) => {
          const [longitude, latitude] = event.lngLat;
          onChangeRef.current({ latitude, longitude });
        };

        map.on("click", handleMapClick);
        clickHandlerRef.current = handleMapClick;
        mapRef.current = map;
      } catch (error) {
        const message = error instanceof Error ? error.message : t("report.locationUnavailable");
        if (!isCancelled) setMapLoadError(message);
      } finally {
        if (!isCancelled) setIsMapLoading(false);
      }
    };

    void initMap();

    return () => {
      isCancelled = true;
      if (mapRef.current && clickHandlerRef.current) {
        mapRef.current.off("click", clickHandlerRef.current);
      }
      clickHandlerRef.current = null;
      markerRef.current?.destroy();
      markerRef.current = null;
      mapRef.current?.destroy();
      mapRef.current = null;
      mapglRef.current = null;
      setIsMapLoading(false);
    };
  }, [hasMapKey, key, language, t]);

  useEffect(() => {
    const map = mapRef.current;
    const mapglApi = mapglRef.current;
    if (!map || !mapglApi) return;

    if (selectedCoordinates) {
      if (!markerRef.current) {
        markerRef.current = new mapglApi.HtmlMarker(map, {
          coordinates: selectedCoordinates,
          html: createLocationMarker(),
          anchor: [14, 14],
          interactive: false,
          preventMapInteractions: false,
          zIndex: 30
        });
      } else {
        markerRef.current.setCoordinates(selectedCoordinates);
      }

      map.setCenter(selectedCoordinates, { duration: 240 });
      map.setZoom(15, { duration: 240 });
      return;
    }

    markerRef.current?.destroy();
    markerRef.current = null;
    map.setCenter(fallbackCenter, { duration: 240 });
    map.setZoom(12, { duration: 240 });
  }, [fallbackCenter, selectedCoordinates]);

  const clearPoint = () => onChangeRef.current({ latitude: null, longitude: null });

  return (
    <Card className="soft-card overflow-hidden p-0">
      <div className="border-b border-app-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="label">{t("report.location")}</p>
            <p className="mt-2 text-sm leading-6 text-app-textMuted">{t("report.locationHint")}</p>
          </div>
          {selectedCoordinates ? (
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              onClick={clearPoint}
              className="inline-flex h-auto items-center gap-2 rounded-full border border-app-border px-3 py-2 text-xs font-semibold text-app-text"
            >
              <RotateCcw size={14} strokeWidth={2} />
              {t("report.locationClear")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        {!hasMapKey ? (
          <div className="rounded-[var(--radius)] border border-[#F0DFC2] bg-[#FFF8EA] p-4 text-sm text-[#8A5A00]">
            {t("report.locationUnavailable")}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="h-[220px] w-full overflow-hidden rounded-[var(--radius)] border border-app-border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(247,247,247,1)_42%,_rgba(238,240,243,1)_100%)] sm:h-[260px] lg:h-[280px]"
          >
            {isMapLoading ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-app-textMuted">
                {t("map.loading")}
              </div>
            ) : null}
          </div>
        )}

        {mapLoadError ? (
          <div className="mt-3 rounded-[var(--radius)] border border-[#F0C7CC] bg-[#FFF5F6] p-4 text-sm text-semantic-down">
            {t("report.locationUnavailable")}: {mapLoadError}
          </div>
        ) : null}

        <div className="mt-4 flex items-start gap-3 rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted px-4 py-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-app-dark text-white">
            <MapPin size={17} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-app-text">
              {selectedCoordinates ? t("report.locationSelected") : t("report.locationMissing")}
            </p>
            <p className="mt-1 text-sm text-app-textMuted">
              {selectedCoordinates ? t("report.locationSelectedHint") : t("report.locationMissingHint")}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
