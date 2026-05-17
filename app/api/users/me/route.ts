import { AppSetupError, getSignedInAppUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type UpdateProfileRequest = {
  phone?: unknown;
};

export async function PATCH(request: Request) {
  try {
    const appUser = await getSignedInAppUser();
    if (!appUser) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    let payload: UpdateProfileRequest;
    try {
      payload = (await request.json()) as UpdateProfileRequest;
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (payload.phone !== undefined && typeof payload.phone !== "string") {
      return Response.json({ error: "Phone must be a string." }, { status: 400 });
    }

    const phone = payload.phone?.trim() || null;

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("users")
      .update({ phone })
      .eq("id", appUser.id)
      .select("phone")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ phone: data.phone }, { status: 200 });
  } catch (error) {
    if (error instanceof AppSetupError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
