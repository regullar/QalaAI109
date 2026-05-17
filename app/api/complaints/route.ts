import { analyzeComplaint, compareDuplicateComplaintsWithAi } from "@/lib/ai";
import { AppSetupError, getSignedInAppUser } from "@/lib/auth";
import { SOURCES } from "@/lib/constants";
import {
  buildDuplicatePersistedFields,
  compareComplaints,
  createDuplicateAiHint,
  isPotentialDuplicateCandidate
} from "@/lib/duplicates";
import { inferComplaintCoordinates, resolveLocationFromTwoGis } from "@/lib/locations";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { AnalyzeComplaintResponse, Complaint } from "@/types/complaint";

type CreateComplaintRequest = {
  rawText?: string;
  district?: string;
  addressText?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  source?: string;
  analysis?: AnalyzeComplaintResponse;
};

function parseNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createPublicId() {
  const now = new Date();
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
  const suffix = `${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
  return `SH-109-${date}-${suffix}`;
}

function isAnalyzeShape(value: unknown): value is AnalyzeComplaintResponse {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.title === "string" && typeof obj.category === "string" && typeof obj.priority === "string";
}

function parseLimit(value: string | null) {
  if (!value) return 500;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return 500;
  return Math.max(1, Math.min(parsed, 2000));
}

type DuplicateCandidateResult = {
  duplicate_ai_hint: ReturnType<typeof createDuplicateAiHint>;
};

function isMissingDuplicateColumnsMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("schema cache") &&
    (normalized.includes("duplicate_ai_hint") ||
      normalized.includes("duplicate_geo_bucket") ||
      normalized.includes("normalized_address") ||
      normalized.includes("duplicate_fingerprint_version"))
  );
}

async function resolveDuplicateHint(
  complaintDraft: Pick<
    Complaint,
    | "id"
    | "public_id"
    | "category"
    | "subcategory"
    | "district"
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
  >
) {
  const baseHint = createDuplicateAiHint(complaintDraft);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { duplicate_ai_hint: baseHint } satisfies DuplicateCandidateResult;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("category", complaintDraft.category)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error || !data || data.length === 0) {
    return { duplicate_ai_hint: baseHint } satisfies DuplicateCandidateResult;
  }

  const candidates = (data as Complaint[])
    .filter((candidate) => isPotentialDuplicateCandidate(complaintDraft, candidate))
    .map((candidate) => ({ candidate, decision: compareComplaints(complaintDraft, candidate) }))
    .sort((left, right) => right.decision.score - left.decision.score);

  const directMatch = candidates.find((item) => item.decision.decision === "match");
  if (directMatch) {
    return {
      duplicate_ai_hint: createDuplicateAiHint(complaintDraft, {
        same_issue: true,
        confidence: 1,
        reason_code: directMatch.decision.reasonCode,
        matched_complaint_id: directMatch.candidate.id,
        matched_public_id: directMatch.candidate.public_id,
        evaluated_at: new Date().toISOString()
      })
    } satisfies DuplicateCandidateResult;
  }

  const uncertainCandidates = candidates
    .filter((item) => item.decision.decision === "uncertain")
    .slice(0, 3);

  for (const item of uncertainCandidates) {
    const aiDecision = await compareDuplicateComplaintsWithAi(complaintDraft, item.candidate);
    if (aiDecision?.same_issue) {
      return {
        duplicate_ai_hint: createDuplicateAiHint(complaintDraft, {
          same_issue: true,
          confidence: aiDecision.confidence,
          reason_code: aiDecision.reason_code,
          matched_complaint_id: item.candidate.id,
          matched_public_id: item.candidate.public_id,
          evaluated_at: new Date().toISOString()
        })
      } satisfies DuplicateCandidateResult;
    }
  }

  if (uncertainCandidates.length > 0) {
    return {
      duplicate_ai_hint: createDuplicateAiHint(complaintDraft, {
        same_issue: false,
        confidence: null,
        reason_code: "ai_rejected",
        evaluated_at: new Date().toISOString()
      })
    } satisfies DuplicateCandidateResult;
  }

  return { duplicate_ai_hint: baseHint } satisfies DuplicateCandidateResult;
}

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  try {
    const appUser = await getSignedInAppUser();
    if (!appUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const district = url.searchParams.get("district");
    const category = url.searchParams.get("category");
    const priority = url.searchParams.get("priority");
    const status = url.searchParams.get("status");
    const limit = parseLimit(url.searchParams.get("limit"));

    const supabase = getSupabaseAdminClient();
    let query = supabase.from("complaints").select("*", { count: "exact" });

    if (appUser.role !== "admin") {
      query = query.eq("user_id", appUser.id);
    }

    if (district && district !== "all") query = query.eq("district", district);
    if (category && category !== "all") query = query.eq("category", category);
    if (priority && priority !== "all") query = query.eq("priority", priority);
    if (status && status !== "all") query = query.eq("status", status);

    const { data, error, count } = await query.order("created_at", { ascending: false }).limit(limit);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ complaints: data || [], total: count || 0 }, { status: 200 });
  } catch (error) {
    if (error instanceof AppSetupError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const appUser = await getSignedInAppUser();
  if (!appUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: CreateComplaintRequest;

  try {
    payload = (await request.json()) as CreateComplaintRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawText = payload.rawText?.trim();
  if (!rawText) {
    return Response.json({ error: "Field `rawText` is required." }, { status: 400 });
  }

  const source =
    typeof payload.source === "string" && SOURCES.includes(payload.source as (typeof SOURCES)[number])
      ? payload.source
      : "Web";

  const parsedLatitude = parseNullableNumber(payload.latitude);
  const parsedLongitude = parseNullableNumber(payload.longitude);

  if (parsedLatitude === null || parsedLongitude === null) {
    return Response.json({ error: "Map point coordinates are required." }, { status: 400 });
  }

  const twoGisKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;
  if (!twoGisKey) {
    return Response.json({ error: "2GIS API key is required to resolve district." }, { status: 503 });
  }

  let twoGisLocation: { district: string | null; addressText: string | null };
  try {
    twoGisLocation = await resolveLocationFromTwoGis({
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      key: twoGisKey,
      locale: "ru_KZ"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve district from 2GIS.";
    return Response.json({ error: message }, { status: 502 });
  }

  if (!twoGisLocation.district) {
    return Response.json({ error: "2GIS did not return a district for this point." }, { status: 400 });
  }

  const analysis = isAnalyzeShape(payload.analysis)
    ? payload.analysis
    : await analyzeComplaint({
        text: rawText,
        district: twoGisLocation.district,
        addressText: payload.addressText || twoGisLocation.addressText || undefined
      });

  try {
    const supabase = getSupabaseAdminClient();
    const publicId = createPublicId();
    const inferredLocation = inferComplaintCoordinates({
      rawText,
      district: twoGisLocation.district,
      addressText: payload.addressText || twoGisLocation.addressText || analysis.addressText,
      latitude: parsedLatitude,
      longitude: parsedLongitude
    });

    const insertDataBase = {
      public_id: publicId,
      user_id: appUser.id,
      raw_text: rawText,
      title: analysis.title,
      description: analysis.summary || rawText,
      summary: analysis.summary,
      category: analysis.category,
      subcategory: analysis.subcategory,
      priority: analysis.priority,
      status: "new",
      district: inferredLocation.district || analysis.district || payload.district || null,
      address_text: inferredLocation.addressText || analysis.addressText || payload.addressText || null,
      latitude: inferredLocation.latitude,
      longitude: inferredLocation.longitude,
      location_text: inferredLocation.addressText || analysis.addressText || payload.addressText || null,
      location_lat: inferredLocation.latitude,
      location_lng: inferredLocation.longitude,
      responsible_service: analysis.responsibleService,
      appeal_text: analysis.appealText,
      risk_factors: analysis.riskFactors,
      ai_confidence: analysis.confidence,
      source,
      is_demo: false,
      needs_emergency_warning: analysis.needsEmergencyWarning
    };

    const duplicatePersistedFields = buildDuplicatePersistedFields({
      id: `draft-${publicId}`,
      public_id: publicId,
      user_id: appUser.id,
      raw_text: insertDataBase.raw_text,
      title: insertDataBase.title,
      description: insertDataBase.description,
      summary: insertDataBase.summary,
      category: insertDataBase.category,
      subcategory: insertDataBase.subcategory,
      priority: insertDataBase.priority,
      status: insertDataBase.status,
      district: insertDataBase.district,
      address_text: insertDataBase.address_text,
      latitude: insertDataBase.latitude,
      longitude: insertDataBase.longitude,
      location_text: insertDataBase.location_text,
      location_lat: insertDataBase.location_lat,
      location_lng: insertDataBase.location_lng,
      responsible_service: insertDataBase.responsible_service,
      appeal_text: insertDataBase.appeal_text,
      risk_factors: insertDataBase.risk_factors,
      ai_confidence: insertDataBase.ai_confidence,
      source: insertDataBase.source,
      is_demo: insertDataBase.is_demo,
      needs_emergency_warning: insertDataBase.needs_emergency_warning,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      normalized_address: null,
      normalized_title: null,
      normalized_summary: null,
      normalized_text: null,
      duplicate_geo_bucket: null,
      duplicate_fingerprint_version: null,
      duplicate_ai_hint: null
    });

    const draftComplaint = {
      id: `draft-${publicId}`,
      public_id: publicId,
      category: insertDataBase.category,
      subcategory: insertDataBase.subcategory,
      district: insertDataBase.district,
      address_text: insertDataBase.address_text,
      title: insertDataBase.title,
      summary: insertDataBase.summary,
      raw_text: insertDataBase.raw_text,
      latitude: insertDataBase.latitude,
      longitude: insertDataBase.longitude,
      normalized_address: duplicatePersistedFields.normalized_address,
      normalized_title: duplicatePersistedFields.normalized_title,
      normalized_summary: duplicatePersistedFields.normalized_summary,
      normalized_text: duplicatePersistedFields.normalized_text,
      duplicate_geo_bucket: duplicatePersistedFields.duplicate_geo_bucket,
      duplicate_ai_hint: null
    } satisfies Pick<
      Complaint,
      | "id"
      | "public_id"
      | "category"
      | "subcategory"
      | "district"
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

    const duplicateHint = await resolveDuplicateHint(draftComplaint);

    const insertData = {
      ...insertDataBase,
      ...duplicatePersistedFields,
      duplicate_ai_hint: duplicateHint.duplicate_ai_hint
    };

    let complaint: Complaint | null = null;
    let complaintError: { message?: string } | null = null;

    const insertWithDedupe = await supabase
      .from("complaints")
      .insert(insertData)
      .select("*")
      .single();

    complaint = (insertWithDedupe.data as Complaint | null) || null;
    complaintError = insertWithDedupe.error;

    if (complaintError && isMissingDuplicateColumnsMessage(complaintError.message || "")) {
      const legacyInsert = await supabase
        .from("complaints")
        .insert(insertDataBase)
        .select("*")
        .single();

      complaint = (legacyInsert.data as Complaint | null) || null;
      complaintError = legacyInsert.error;
    }

    if (complaintError || !complaint) {
      return Response.json(
        { error: complaintError?.message || "Failed to create complaint." },
        { status: 500 }
      );
    }

    const { error: logError } = await supabase.from("status_logs").insert({
      complaint_id: complaint.id,
      old_status: null,
      new_status: "new",
      comment: "Created from report form"
    });

    if (logError) {
      await supabase.from("complaints").delete().eq("id", complaint.id);
      return Response.json({ error: "Failed to create status log." }, { status: 500 });
    }

    return Response.json(
      { message: "Спасибо! Ваша жалоба принята. Мы уже начали её обработку." },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppSetupError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
