import { STATUSES } from "@/lib/constants";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { ComplaintStatus } from "@/types/complaint";

type UpdateStatusRequest = {
  status?: ComplaintStatus;
  comment?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidStatus(value: unknown): value is ComplaintStatus {
  return typeof value === "string" && STATUSES.includes(value as (typeof STATUSES)[number]);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let payload: UpdateStatusRequest;

  try {
    payload = (await request.json()) as UpdateStatusRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidStatus(payload.status)) {
    return Response.json(
      {
        error: "Field `status` is required and must be one of: new, checking, assigned, in_progress, resolved, rejected."
      },
      { status: 400 }
    );
  }

  const nextStatus = payload.status;
  const comment = typeof payload.comment === "string" && payload.comment.trim() ? payload.comment.trim() : null;

  try {
    const supabase = getSupabaseAdminClient();
    const complaintQuery = isUuid(id)
      ? supabase.from("complaints").select("*").eq("id", id).maybeSingle()
      : supabase.from("complaints").select("*").eq("public_id", id).maybeSingle();

    const { data: complaint, error: findError } = await complaintQuery;
    if (findError) {
      return Response.json({ error: findError.message }, { status: 500 });
    }

    if (!complaint) {
      return Response.json({ error: "Complaint not found." }, { status: 404 });
    }

    const oldStatus = complaint.status as ComplaintStatus;
    if (oldStatus === nextStatus) {
      return Response.json({ complaint, unchanged: true }, { status: 200 });
    }

    const { data: updatedComplaint, error: updateError } = await supabase
      .from("complaints")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", complaint.id)
      .select("*")
      .single();

    if (updateError || !updatedComplaint) {
      return Response.json(
        { error: updateError?.message || "Failed to update complaint status." },
        { status: 500 }
      );
    }

    const { data: statusLog, error: logError } = await supabase
      .from("status_logs")
      .insert({
        complaint_id: complaint.id,
        old_status: oldStatus,
        new_status: nextStatus,
        comment
      })
      .select("*")
      .single();

    if (logError || !statusLog) {
      return Response.json({ error: logError?.message || "Failed to create status log." }, { status: 500 });
    }

    return Response.json(
      {
        complaint: updatedComplaint,
        statusLog
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
