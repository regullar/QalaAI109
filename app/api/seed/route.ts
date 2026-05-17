import { DEMO_COMPLAINTS } from "@/lib/demo-data";
import { buildDuplicatePersistedFields, createDuplicateAiHint } from "@/lib/duplicates";
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

    const rows = DEMO_COMPLAINTS.map((item, index) => {
      const public_id = publicId(index);
      const persisted = buildDuplicatePersistedFields({
        id: `seed-${index}`,
        public_id,
        user_id: null,
        raw_text: item.raw_text,
        title: item.title,
        description: item.summary,
        summary: item.summary,
        category: item.category,
        subcategory: item.subcategory,
        priority: item.priority,
        status: item.status,
        district: item.district,
        address_text: item.address_text,
        latitude: item.latitude,
        longitude: item.longitude,
        location_text: item.address_text,
        location_lat: item.latitude,
        location_lng: item.longitude,
        responsible_service: item.responsible_service,
        appeal_text: item.appeal_text,
        risk_factors: item.risk_factors,
        ai_confidence: item.ai_confidence,
        source: item.source,
        is_demo: item.is_demo,
        needs_emergency_warning: item.needs_emergency_warning,
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

      return {
        ...item,
        public_id,
        ...persisted,
        duplicate_ai_hint: createDuplicateAiHint({
          id: `seed-${index}`,
          public_id,
          user_id: null,
          raw_text: item.raw_text,
          title: item.title,
          description: item.summary,
          summary: item.summary,
          category: item.category,
          subcategory: item.subcategory,
          priority: item.priority,
          status: item.status,
          district: item.district,
          address_text: item.address_text,
          latitude: item.latitude,
          longitude: item.longitude,
          location_text: item.address_text,
          location_lat: item.latitude,
          location_lng: item.longitude,
          responsible_service: item.responsible_service,
          appeal_text: item.appeal_text,
          risk_factors: item.risk_factors,
          ai_confidence: item.ai_confidence,
          source: item.source,
          is_demo: item.is_demo,
          needs_emergency_warning: item.needs_emergency_warning,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          normalized_address: persisted.normalized_address,
          normalized_title: persisted.normalized_title,
          normalized_summary: persisted.normalized_summary,
          normalized_text: persisted.normalized_text,
          duplicate_geo_bucket: persisted.duplicate_geo_bucket,
          duplicate_fingerprint_version: persisted.duplicate_fingerprint_version,
          duplicate_ai_hint: null
        })
      };
    });

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
