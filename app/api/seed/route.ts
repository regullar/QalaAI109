import { DEMO_COMPLAINTS } from "@/lib/demo-data";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

function publicId(index: number) {
  return `SH-109-DEMO-${Date.now()}-${String(index + 1).padStart(3, "0")}`;
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const force = url.searchParams.get("force") === "1";
  const isProduction = process.env.NODE_ENV === "production";
  const seedToken = process.env.SEED_TOKEN;

  if (isProduction) {
    if (!seedToken || token !== seedToken) {
      return Response.json({ error: "Seed endpoint is protected in production." }, { status: 403 });
    }
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { count, error: countError } = await supabase
      .from("complaints")
      .select("id", { count: "exact", head: true });

    if (countError) {
      return Response.json({ error: countError.message }, { status: 500 });
    }

    if ((count || 0) > 0 && !force) {
      return Response.json({ inserted: 0, skipped: true, reason: "Таблица не пустая." }, { status: 200 });
    }

    if (force) {
      const { error: deleteError } = await supabase.from("complaints").delete().eq("is_demo", true);
      if (deleteError) {
        return Response.json({ error: deleteError.message }, { status: 500 });
      }
    }

    const rows = DEMO_COMPLAINTS.map((item, index) => ({
      ...item,
      public_id: publicId(index)
    }));

    const { data: insertedComplaints, error: insertError } = await supabase
      .from("complaints")
      .insert(rows)
      .select("id,status");

    if (insertError || !insertedComplaints) {
      return Response.json({ error: insertError?.message || "Не удалось добавить демо-обращения." }, { status: 500 });
    }

    const logs = insertedComplaints.map((item) => ({
      complaint_id: item.id,
      old_status: null,
      new_status: item.status,
      comment: "Создано из демо-данных"
    }));

    const { error: logsError } = await supabase.from("status_logs").insert(logs);
    if (logsError) {
      return Response.json({ error: logsError.message }, { status: 500 });
    }

    return Response.json({ inserted: insertedComplaints.length, skipped: false }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная серверная ошибка.";
    return Response.json({ error: message }, { status: 500 });
  }
}
