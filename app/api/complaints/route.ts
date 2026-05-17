import { analyzeComplaint } from "@/lib/ai";
import { SOURCES } from "@/lib/constants";
import { inferComplaintCoordinates } from "@/lib/locations";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { AnalyzeComplaintResponse } from "@/types/complaint";

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

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const district = url.searchParams.get("district");
    const category = url.searchParams.get("category");
    const priority = url.searchParams.get("priority");
    const status = url.searchParams.get("status");
    const limit = parseLimit(url.searchParams.get("limit"));

    const supabase = getSupabaseAdminClient();
    let query = supabase.from("complaints").select("*", { count: "exact" });

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
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  const analysis = isAnalyzeShape(payload.analysis)
    ? payload.analysis
    : await analyzeComplaint({
        text: rawText,
        district: payload.district,
        addressText: payload.addressText
      });

  try {
    const supabase = getSupabaseAdminClient();
    const publicId = createPublicId();
    const inferredLocation = inferComplaintCoordinates({
      rawText,
      district: analysis.district || payload.district,
      addressText: analysis.addressText || payload.addressText,
      latitude: parsedLatitude,
      longitude: parsedLongitude
    });

    const insertData = {
      public_id: publicId,
      raw_text: rawText,
      title: analysis.title,
      summary: analysis.summary,
      category: analysis.category,
      subcategory: analysis.subcategory,
      priority: analysis.priority,
      status: "new",
      district: inferredLocation.district || analysis.district || payload.district || null,
      address_text: inferredLocation.addressText || analysis.addressText || payload.addressText || null,
      latitude: inferredLocation.latitude,
      longitude: inferredLocation.longitude,
      responsible_service: analysis.responsibleService,
      appeal_text: analysis.appealText,
      risk_factors: analysis.riskFactors,
      ai_confidence: analysis.confidence,
      source,
      is_demo: false,
      needs_emergency_warning: analysis.needsEmergencyWarning
    };

    const { data: complaint, error: complaintError } = await supabase
      .from("complaints")
      .insert(insertData)
      .select("*")
      .single();

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
      {
        complaint,
        analysisSource: analysis.source
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
