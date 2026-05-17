import { DEMO_LOCATION_PRESETS, DISTRICT_COORDINATES, DISTRICTS, SHYMKENT_CENTER } from "./constants";

type CoordinateInput = {
  rawText?: string | null;
  district?: string | null;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type TwoGisAdmDiv = {
  type?: string | null;
  name?: string | null;
  caption?: string | null;
};

type TwoGisItem = {
  adm_div?: TwoGisAdmDiv[] | null;
  address_name?: string | null;
  full_address_name?: string | null;
  name?: string | null;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeDistrictName(value: string | null | undefined) {
  return normalizeText(value)
    .replace(/ё/g, "е")
    .replace(/ә/g, "а")
    .replace(/ө/g, "о")
    .replace(/ү/g, "у")
    .replace(/ұ/g, "у")
    .replace(/і/g, "и")
    .replace(/қ/g, "к")
    .replace(/ғ/g, "г")
    .replace(/ң/g, "н")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

function matchKnownDistrict(value: string | null | undefined) {
  const normalized = normalizeDistrictName(value);
  if (!normalized) return null;

  if (normalized.includes("туран") || normalized.includes("turan")) {
    return "район Тұран";
  }

  return (
    DISTRICTS.find((district) => {
      const known = normalizeDistrictName(district);
      return normalized === known || normalized.includes(known) || known.includes(normalized);
    }) || null
  );
}

export function extractDistrictFromTwoGisItems(items: TwoGisItem[]) {
  for (const item of items) {
    const district = item.adm_div?.find((entry) => entry.type === "adm_div.district");
    const knownDistrict = matchKnownDistrict(district?.name || district?.caption);
    if (knownDistrict) return knownDistrict;
  }

  for (const item of items) {
    for (const entry of item.adm_div || []) {
      const knownDistrict = matchKnownDistrict(entry.name || entry.caption);
      if (knownDistrict) return knownDistrict;
    }
  }

  return null;
}

export function extractAddressFromTwoGisItems(items: TwoGisItem[]) {
  const item = items[0];
  return item?.full_address_name || item?.address_name || item?.name || null;
}

export async function resolveLocationFromTwoGis(input: {
  latitude: number;
  longitude: number;
  key: string;
  locale?: string;
}) {
  const url = new URL("https://catalog.api.2gis.com/3.0/items/geocode");
  url.searchParams.set("key", input.key);
  url.searchParams.set("lon", String(input.longitude));
  url.searchParams.set("lat", String(input.latitude));
  url.searchParams.set("fields", "items.adm_div,items.address,items.full_address_name");
  url.searchParams.set("page_size", "1");
  if (input.locale) url.searchParams.set("locale", input.locale);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`2GIS geocoder failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    result?: {
      items?: TwoGisItem[];
    };
  };
  const items = data.result?.items || [];

  return {
    district: extractDistrictFromTwoGisItems(items),
    addressText: extractAddressFromTwoGisItems(items)
  };
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
