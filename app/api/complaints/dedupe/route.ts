import { compareDuplicateComplaintsWithAi } from "@/lib/ai";
import { AppSetupError, getSignedInAppUser } from "@/lib/auth";
import {
  buildDuplicatePersistedFields,
  compareComplaints,
  createDuplicateAiHint,
  isPotentialDuplicateCandidate
} from "@/lib/duplicates";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Complaint } from "@/types/complaint";

type ComplaintForDedupe = Pick<
  Complaint,
  | "id"
  | "public_id"
  | "user_id"
  | "raw_text"
  | "title"
  | "description"
  | "summary"
  | "category"
  | "subcategory"
  | "priority"
  | "status"
  | "district"
  | "address_text"
  | "latitude"
  | "longitude"
  | "location_text"
  | "location_lat"
  | "location_lng"
  | "responsible_service"
  | "appeal_text"
  | "risk_factors"
  | "ai_confidence"
  | "source"
  | "is_demo"
  | "needs_emergency_warning"
  | "created_at"
  | "updated_at"
  | "normalized_address"
  | "normalized_title"
  | "normalized_summary"
  | "normalized_text"
  | "duplicate_geo_bucket"
  | "duplicate_fingerprint_version"
  | "duplicate_ai_hint"
>;

async function resolveHistoricalHint(
  complaintDraft: ComplaintForDedupe,
  previousComplaints: ComplaintForDedupe[]
) {
  const baseHint = createDuplicateAiHint(complaintDraft);
  const candidates = previousComplaints
    .filter((candidate) => isPotentialDuplicateCandidate(complaintDraft, candidate))
    .map((candidate) => ({ candidate, decision: compareComplaints(complaintDraft, candidate) }))
    .sort((left, right) => right.decision.score - left.decision.score);

  const directMatch = candidates.find((item) => item.decision.decision === "match");
  if (directMatch) {
    return createDuplicateAiHint(complaintDraft, {
      same_issue: true,
      confidence: 1,
      reason_code: directMatch.decision.reasonCode,
      matched_complaint_id: directMatch.candidate.id,
      matched_public_id: directMatch.candidate.public_id,
      evaluated_at: new Date().toISOString()
    });
  }

  const uncertainCandidates = candidates
    .filter((item) => item.decision.decision === "uncertain")
    .slice(0, 3);

  for (const item of uncertainCandidates) {
    const aiDecision = await compareDuplicateComplaintsWithAi(complaintDraft, item.candidate);
    if (aiDecision?.same_issue) {
      return createDuplicateAiHint(complaintDraft, {
        same_issue: true,
        confidence: aiDecision.confidence,
        reason_code: aiDecision.reason_code,
        matched_complaint_id: item.candidate.id,
        matched_public_id: item.candidate.public_id,
        evaluated_at: new Date().toISOString()
      });
    }
  }

  if (uncertainCandidates.length > 0) {
    return createDuplicateAiHint(complaintDraft, {
      same_issue: false,
      confidence: null,
      reason_code: "ai_rejected",
      evaluated_at: new Date().toISOString()
    });
  }

  return baseHint;
}

function parseLimit(value: string | null) {
  if (!value) return 500;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return 500;
  return Math.max(1, Math.min(parsed, 2000));
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  try {
    const appUser = await getSignedInAppUser();
    if (!appUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (appUser.role !== "admin") {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get("limit"));
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const complaints = (data || []) as ComplaintForDedupe[];
    const processed: ComplaintForDedupe[] = [];
    let updated = 0;

    for (const complaint of complaints) {
      const persisted = buildDuplicatePersistedFields(complaint);
      const complaintDraft: ComplaintForDedupe = {
        ...complaint,
        ...persisted,
        duplicate_ai_hint: complaint.duplicate_ai_hint
      };

      const duplicateAiHint = await resolveHistoricalHint(complaintDraft, processed);
      const updatePayload = {
        ...persisted,
        duplicate_ai_hint: duplicateAiHint
      };

      const { error: updateError } = await supabase
        .from("complaints")
        .update(updatePayload)
        .eq("id", complaint.id);

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }

      processed.push({
        ...complaintDraft,
        duplicate_ai_hint: duplicateAiHint
      });
      updated += 1;
    }

    return Response.json({ updated }, { status: 200 });
  } catch (error) {
    if (error instanceof AppSetupError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
