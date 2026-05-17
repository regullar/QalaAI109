import { DEMO_LOCATION_PRESETS, DISTRICT_COORDINATES, DISTRICTS, SHYMKENT_CENTER } from "./constants";

type CoordinateInput = {
  rawText?: string | null;
  district?: string | null;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function inferComplaintCoordinates(input: CoordinateInput): {
  latitude: number;
  longitude: number;
  district?: string;
  addressText?: string;
} {
  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    return {
      latitude: input.latitude,
      longitude: input.longitude,
      district: input.district || undefined,
      addressText: input.addressText || undefined
    };
  }

  const haystack = normalizeText(`${input.rawText || ""} ${input.addressText || ""}`);
  const preset = DEMO_LOCATION_PRESETS.find((item) =>
    item.names.some((name) => haystack.includes(name.toLowerCase()))
  );

  if (preset) {
    return {
      latitude: preset.latitude,
      longitude: preset.longitude,
      district: input.district || preset.district,
      addressText: input.addressText || preset.addressText
    };
  }

  const district = DISTRICTS.find((item) => item === input.district);
  if (district) {
    const coords = DISTRICT_COORDINATES[district];
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      district,
      addressText: input.addressText || undefined
    };
  }

  return {
    latitude: SHYMKENT_CENTER.lat,
    longitude: SHYMKENT_CENTER.lng,
    district: input.district || undefined,
    addressText: input.addressText || undefined
  };
}
