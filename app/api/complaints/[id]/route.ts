import { AppSetupError, getSignedInAppUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const { id } = await context.params;

  try {
    const appUser = await getSignedInAppUser();
    if (!appUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const complaintQuery = isUuid(id)
      ? supabase.from("complaints").select("*").eq("id", id).maybeSingle()
      : supabase.from("complaints").select("*").eq("public_id", id).maybeSingle();

    const { data: complaint, error: complaintError } = await complaintQuery;
    if (complaintError) {
      return Response.json({ error: complaintError.message }, { status: 500 });
    }

    if (!complaint) {
      return Response.json({ error: "Complaint not found." }, { status: 404 });
    }

    if (appUser.role !== "admin" && complaint.user_id !== appUser.id) {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: statusLogs, error: logsError } = await supabase
      .from("status_logs")
      .select("*")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: true });

    if (logsError) {
      return Response.json({ error: logsError.message }, { status: 500 });
    }

    return Response.json({ complaint, statusLogs: statusLogs || [] }, { status: 200 });
  } catch (error) {
    if (error instanceof AppSetupError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
