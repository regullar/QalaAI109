import type { Complaint } from "@/types/complaint";

export type DuplicateReasonCode =
  | "deterministic_match"
  | "ai_confirmed"
  | "ai_rejected"
  | "category_mismatch"
  | "distance_conflict"
  | "address_conflict"
  | "low_score"
  | "insufficient_location"
  | "borderline";

export type DuplicateAiHint = {
  signature: string;
  same_issue: boolean | null;
  confidence: number | null;
  reason_code: DuplicateReasonCode | string | null;
  matched_complaint_id: string | null;
  matched_public_id: string | null;
  evaluated_at: string | null;
};

export type ComplaintFingerprint = {
  normalizedAddress: string;
  normalizedTitle: string;
  normalizedSummary: string;
  normalizedText: string;
  duplicateGeoBucket: string | null;
  duplicateFingerprintVersion: number;
  signature: string;
  district: string;
  category: string;
  subcategory: string;
  latitude: number | null;
  longitude: number | null;
  titleTokens: string[];
  summaryTokens: string[];
  textTokens: string[];
  addressTokens: string[];
  signatureTokens: string[];
};

export type DuplicateSignals = {
  categoryExact: boolean;
  districtExact: boolean;
  subcategoryExact: boolean;
  addressSimilarity: number;
  textSimilarity: number;
  signatureSimilarity: number;
  distanceMeters: number | null;
  geoNeighbor: boolean;
  sharedLocationEvidence: boolean;
};

export type DuplicateDecision = {
  score: number;
  decision: "match" | "uncertain" | "no_match";
  reasonCode: DuplicateReasonCode;
  signals: DuplicateSignals;
};

const GEO_BUCKET_SIZE = 0.0025;
const DUPLICATE_FINGERPRINT_VERSION = 2;
const UNKNOWN_DISTRICT = "Не определен";

const STOP_WORDS = new Set([
  "и",
  "в",
  "во",
  "на",
  "по",
  "у",
  "за",
  "из",
  "под",
  "над",
  "для",
  "что",
  "это",
  "нет",
  "не",
  "где",
  "там",
  "возле",
  "рядом",
  "около",
  "прошу",
  "пожалуйста",
  "снова",
  "очень",
  "уже",
  "еще",
  "если",
  "или",
  "как",
  "бы",
  "дом",
  "дома",
  "двор",
  "улица",
  "ул",
  "проспект",
  "пр",
  "район",
  "мкр",
  "микрорайон",
  "шагым",
  "өтініш",
  "жители",
  "тұрғындар",
  "жол",
  "көшe",
  "көше"
]);

type FingerprintInput = Pick<
  Complaint,
  | "district"
  | "category"
  | "subcategory"
  | "address_text"
  | "title"
  | "summary"
  | "raw_text"
  | "latitude"
  | "longitude"
  | "normalized_address"
  | "normalized_title"
  | "normalized_summary"
  | "normalized_text"
  | "duplicate_geo_bucket"
  | "duplicate_ai_hint"
>;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeAddress(address: string | null | undefined) {
  if (!address) return "";
  return normalizeWhitespace(
    address
      .toLowerCase()
      .replace(/мкр|микрорайон|microdistrict|mkr|district|район/giu, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
  );
}

export function normalizeDuplicateText(text: string | null | undefined) {
  if (!text) return "";
  return normalizeWhitespace(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\b(шымкент|жалоба|обращение|проблема|вопрос)\b/giu, " ")
  );
}

function tokenize(normalized: string) {
  if (!normalized) return [];

  const unique = new Set(
    normalized
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
  );

  return Array.from(unique).sort();
}

function tokenSimilarity(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0;
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) intersection += 1;
  }

  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : intersection / union;
}

function stringSimilarity(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.88;
  return tokenSimilarity(tokenize(left), tokenize(right));
}

function normalizeDistrict(district: string | null | undefined) {
  const value = normalizeDuplicateText(district);
  return value || UNKNOWN_DISTRICT;
}

function normalizeCategory(category: string | null | undefined) {
  return normalizeDuplicateText(category) || "другое";
}

function buildGeoBucket(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) return null;
  const latBucket = Math.round(latitude / GEO_BUCKET_SIZE);
  const lngBucket = Math.round(longitude / GEO_BUCKET_SIZE);
  return `${latBucket}:${lngBucket}`;
}

function buildSignature(input: {
  category: string;
  subcategory: string;
  normalizedAddress: string;
  titleTokens: string[];
  summaryTokens: string[];
  textTokens: string[];
}) {
  const signalTokens = Array.from(
    new Set([
      ...input.titleTokens.slice(0, 5),
      ...input.summaryTokens.slice(0, 4),
      ...input.textTokens.slice(0, 6)
    ])
  ).slice(0, 10);

  return [input.category, input.subcategory, input.normalizedAddress || "na", signalTokens.join(" ")].join("|");
}

export function readDuplicateAiHint(complaint: Pick<Complaint, "duplicate_ai_hint">): DuplicateAiHint | null {
  const raw = complaint.duplicate_ai_hint;
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as DuplicateAiHint;
    } catch {
      return null;
    }
  }

  if (typeof raw === "object") {
    return raw as DuplicateAiHint;
  }

  return null;
}

export function computeComplaintFingerprint<T extends FingerprintInput>(complaint: T): ComplaintFingerprint {
  const normalizedAddress = complaint.normalized_address || normalizeAddress(complaint.address_text);
  const normalizedTitle = complaint.normalized_title || normalizeDuplicateText(complaint.title);
  const normalizedSummary = complaint.normalized_summary || normalizeDuplicateText(complaint.summary);
  const normalizedText =
    complaint.normalized_text ||
    normalizeDuplicateText([complaint.title, complaint.summary, complaint.raw_text].filter(Boolean).join(" "));
  const duplicateGeoBucket =
    complaint.duplicate_geo_bucket || buildGeoBucket(complaint.latitude, complaint.longitude);
  const district = normalizeDistrict(complaint.district);
  const category = normalizeCategory(complaint.category);
  const subcategory = normalizeDuplicateText(complaint.subcategory);
  const titleTokens = tokenize(normalizedTitle);
  const summaryTokens = tokenize(normalizedSummary);
  const textTokens = tokenize(normalizedText);
  const addressTokens = tokenize(normalizedAddress);
  const storedHint = readDuplicateAiHint(complaint);
  const signature =
    storedHint?.signature ||
    buildSignature({
      category,
      subcategory,
      normalizedAddress,
      titleTokens,
      summaryTokens,
      textTokens
    });
  const signatureTokens = tokenize(signature);

  return {
    normalizedAddress,
    normalizedTitle,
    normalizedSummary,
    normalizedText,
    duplicateGeoBucket,
    duplicateFingerprintVersion: DUPLICATE_FINGERPRINT_VERSION,
    signature,
    district,
    category,
    subcategory,
    latitude: complaint.latitude,
    longitude: complaint.longitude,
    titleTokens,
    summaryTokens,
    textTokens,
    addressTokens,
    signatureTokens
  };
}

export function buildDuplicatePersistedFields<T extends FingerprintInput>(complaint: T) {
  const fingerprint = computeComplaintFingerprint(complaint);
  return {
    normalized_address: fingerprint.normalizedAddress || null,
    normalized_title: fingerprint.normalizedTitle || null,
    normalized_summary: fingerprint.normalizedSummary || null,
    normalized_text: fingerprint.normalizedText || null,
    duplicate_geo_bucket: fingerprint.duplicateGeoBucket,
    duplicate_fingerprint_version: fingerprint.duplicateFingerprintVersion
  };
}

export function createDuplicateAiHint<T extends FingerprintInput>(
  complaint: T,
  details?: Partial<Omit<DuplicateAiHint, "signature">>
): DuplicateAiHint {
  const fingerprint = computeComplaintFingerprint(complaint);
  return {
    signature: fingerprint.signature,
    same_issue: details?.same_issue ?? null,
    confidence: details?.confidence ?? null,
    reason_code: details?.reason_code ?? null,
    matched_complaint_id: details?.matched_complaint_id ?? null,
    matched_public_id: details?.matched_public_id ?? null,
    evaluated_at: details?.evaluated_at ?? null
  };
}

function haversineDistanceMeters(
  left: [number, number] | null,
  right: [number, number] | null
) {
  if (!left || !right) return null;

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const [lng1, lat1] = left;
  const [lng2, lat2] = right;

  const earthRadius = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function areNeighboringGeoBuckets(left: string | null, right: string | null) {
  if (!left || !right) return false;
  const [latA, lngA] = left.split(":").map(Number);
  const [latB, lngB] = right.split(":").map(Number);
  if ([latA, lngA, latB, lngB].some((value) => Number.isNaN(value))) return false;
  return Math.abs(latA - latB) <= 1 && Math.abs(lngA - lngB) <= 1;
}

export function isPotentialDuplicateCandidate<TLeft extends FingerprintInput, TRight extends FingerprintInput>(
  left: TLeft,
  right: TRight
) {
  const leftFingerprint = computeComplaintFingerprint(left);
  const rightFingerprint = computeComplaintFingerprint(right);

  return isPotentialDuplicateFingerprintCandidate(leftFingerprint, rightFingerprint);
}

export function isPotentialDuplicateFingerprintCandidate(
  leftFingerprint: ComplaintFingerprint,
  rightFingerprint: ComplaintFingerprint
) {
  if (leftFingerprint.category !== rightFingerprint.category) return false;

  const sameDistrict =
    leftFingerprint.district === rightFingerprint.district ||
    leftFingerprint.district === UNKNOWN_DISTRICT ||
    rightFingerprint.district === UNKNOWN_DISTRICT;
  const geoNeighbor = areNeighboringGeoBuckets(
    leftFingerprint.duplicateGeoBucket,
    rightFingerprint.duplicateGeoBucket
  );
  const addressSimilarity = stringSimilarity(
    leftFingerprint.normalizedAddress,
    rightFingerprint.normalizedAddress
  );

  return sameDistrict || geoNeighbor || addressSimilarity >= 0.34;
}

export function compareComplaintFingerprints(
  a: ComplaintFingerprint,
  b: ComplaintFingerprint
): DuplicateDecision {
  const distanceMeters = haversineDistanceMeters(
    a.latitude !== null && a.longitude !== null ? [a.longitude, a.latitude] : null,
    b.latitude !== null && b.longitude !== null ? [b.longitude, b.latitude] : null
  );
  const addressSimilarity = stringSimilarity(a.normalizedAddress, b.normalizedAddress);
  const titleSimilarity = tokenSimilarity(a.titleTokens, b.titleTokens);
  const summarySimilarity = tokenSimilarity(a.summaryTokens, b.summaryTokens);
  const textSimilarity = Math.max(
    tokenSimilarity(a.textTokens, b.textTokens),
    titleSimilarity * 0.45 + summarySimilarity * 0.35 + tokenSimilarity(a.addressTokens, b.addressTokens) * 0.2
  );
  const signatureSimilarity = tokenSimilarity(a.signatureTokens, b.signatureTokens);
  const districtExact = a.district === b.district;
  const categoryExact = a.category === b.category;
  const subcategoryExact = a.subcategory !== "" && a.subcategory === b.subcategory;
  const geoNeighbor = areNeighboringGeoBuckets(a.duplicateGeoBucket, b.duplicateGeoBucket);
  const sharedLocationEvidence =
    distanceMeters !== null || (a.normalizedAddress !== "" && b.normalizedAddress !== "");

  const signals: DuplicateSignals = {
    categoryExact,
    districtExact,
    subcategoryExact,
    addressSimilarity,
    textSimilarity,
    signatureSimilarity,
    distanceMeters,
    geoNeighbor,
    sharedLocationEvidence
  };

  if (!categoryExact) {
    return { score: 0, decision: "no_match", reasonCode: "category_mismatch", signals };
  }

  if (distanceMeters !== null && distanceMeters > 800) {
    return { score: 0, decision: "no_match", reasonCode: "distance_conflict", signals };
  }

  if (
    a.normalizedAddress &&
    b.normalizedAddress &&
    addressSimilarity < 0.2 &&
    (distanceMeters === null || distanceMeters > 250)
  ) {
    return { score: 0, decision: "no_match", reasonCode: "address_conflict", signals };
  }

  let score = 20;

  if (districtExact) score += 6;
  if (subcategoryExact) score += 10;

  if (a.normalizedAddress && b.normalizedAddress) {
    if (addressSimilarity >= 0.98) score += 34;
    else if (addressSimilarity >= 0.82) score += 26;
    else if (addressSimilarity >= 0.58) score += 16;
  }

  if (distanceMeters !== null) {
    if (distanceMeters <= 80) score += 32;
    else if (distanceMeters <= 180) score += 24;
    else if (distanceMeters <= 350) score += 14;
    else if (distanceMeters <= 600) score += 6;
  } else if (geoNeighbor) {
    score += 8;
  }

  if (textSimilarity >= 0.78) score += 18;
  else if (textSimilarity >= 0.62) score += 12;
  else if (textSimilarity >= 0.48) score += 6;

  if (signatureSimilarity >= 0.82) score += 12;
  else if (signatureSimilarity >= 0.64) score += 7;

  if (!sharedLocationEvidence && textSimilarity < 0.86) {
    return { score, decision: "uncertain", reasonCode: "insufficient_location", signals };
  }

  if (score >= 60) {
    return { score, decision: "match", reasonCode: "deterministic_match", signals };
  }

  if (score >= 46) {
    return { score, decision: "uncertain", reasonCode: "borderline", signals };
  }

  return { score, decision: "no_match", reasonCode: "low_score", signals };
}

export function compareComplaints<TLeft extends FingerprintInput, TRight extends FingerprintInput>(
  left: TLeft,
  right: TRight
): DuplicateDecision {
  const a = computeComplaintFingerprint(left);
  const b = computeComplaintFingerprint(right);
  return compareComplaintFingerprints(a, b);
}

export function hasConfirmedDuplicateEdge(
  complaint: Pick<Complaint, "id" | "duplicate_ai_hint">,
  targetComplaintId: string
) {
  const hint = readDuplicateAiHint(complaint);
  if (!hint) return false;
  return hint.same_issue === true && hint.matched_complaint_id === targetComplaintId;
}

export function getDuplicateFingerprintVersion() {
  return DUPLICATE_FINGERPRINT_VERSION;
}
