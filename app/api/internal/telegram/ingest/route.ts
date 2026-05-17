import { analyzeComplaint } from "@/lib/ai";
import { SOURCES } from "@/lib/constants";
import { buildDuplicatePersistedFields, createDuplicateAiHint } from "@/lib/duplicates";
import { inferComplaintCoordinates } from "@/lib/locations";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  filterTelegramMessagesForIngest,
  groupTelegramMessagesForComplaints,
  isAuthorizedInternalRequest,
  type TelegramIngestMessage
} from "@/lib/telegram-internal";
import type { Complaint } from "@/types/complaint";

type TelegramIngestRequest = {
  chat?: {
    chatId?: string;
    title?: string | null;
  };
  window?: {
    startedAt?: string;
    endedAt?: string;
  };
  messages?: TelegramIngestMessage[];
};

function createPublicId() {
  const now = new Date();
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
  const suffix = `${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
  return `SH-109-${date}-${suffix}`;
}

function normalizeDistrict(value: string | null | undefined) {
  if (!value || value === "Не определен") return null;
  return value;
}

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

export async function POST(request: Request) {
  if (!isAuthorizedInternalRequest(request.headers, process.env.BOT_INTERNAL_API_SECRET)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminUserId = process.env.BOT_DEFAULT_ADMIN_USER_ID;
  if (!adminUserId) {
    return Response.json({ error: "BOT_DEFAULT_ADMIN_USER_ID is not configured." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => null)) as TelegramIngestRequest | null;
  if (!payload?.chat?.chatId || !Array.isArray(payload.messages)) {
    return Response.json({ error: "Fields `chat.chatId` and `messages` are required." }, { status: 400 });
  }

  const filteredMessages = filterTelegramMessagesForIngest(payload.messages);
  const groups = groupTelegramMessagesForComplaints(filteredMessages);
  const supabase = getSupabaseAdminClient();
  const { data: configuredChat, error: configuredChatError } = await supabase
    .from("telegram_chats")
    .select("*")
    .eq("chat_id", payload.chat.chatId)
    .maybeSingle();

  if (configuredChatError) {
    return Response.json({ error: configuredChatError.message }, { status: 500 });
  }

  if (!configuredChat) {
    return Response.json({ error: "Telegram chat is not configured. Run /qala_start first." }, { status: 400 });
  }

  const userUpsert = await supabase.from("users").upsert({ id: adminUserId, role: "admin" }, { onConflict: "id" });
  if (userUpsert.error) {
    return Response.json({ error: userUpsert.error.message }, { status: 500 });
  }

  const windowInsert = await supabase
    .from("telegram_collection_windows")
    .insert({
      chat_id: payload.chat.chatId,
      status: "processed",
      started_at: payload.window?.startedAt || new Date().toISOString(),
      ends_at: payload.window?.endedAt || new Date().toISOString(),
      processed_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (windowInsert.error) {
    return Response.json({ error: windowInsert.error.message }, { status: 500 });
  }

  const complaints: Complaint[] = [];
  const source = SOURCES.includes("Telegram Demo" as (typeof SOURCES)[number]) ? "Telegram Demo" : "Telegram";

  for (const group of groups) {
    const analysis = await analyzeComplaint({ text: group.rawText });
    const inferredLocation = inferComplaintCoordinates({
      rawText: group.rawText,
      district: normalizeDistrict(analysis.district) || configuredChat.district,
      addressText: analysis.addressText || configuredChat.address_text || payload.chat.title || "Telegram chat",
      latitude: configuredChat.latitude,
      longitude: configuredChat.longitude
    });
    const publicId = createPublicId();

    const insertDataBase = {
      public_id: publicId,
      user_id: adminUserId,
      raw_text: group.rawText,
      title: analysis.title,
      description: analysis.summary || group.rawText,
      summary: analysis.summary,
      category: analysis.category,
      subcategory: analysis.subcategory,
      priority: analysis.priority,
      status: "new",
      district: inferredLocation.district || normalizeDistrict(analysis.district) || configuredChat.district,
      address_text:
        inferredLocation.addressText || analysis.addressText || configuredChat.address_text || "Telegram chat",
      latitude: inferredLocation.latitude,
      longitude: inferredLocation.longitude,
      location_text:
        inferredLocation.addressText || analysis.addressText || configuredChat.address_text || "Telegram chat",
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
      user_id: adminUserId,
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

    const insertData = {
      ...insertDataBase,
      ...duplicatePersistedFields,
      duplicate_ai_hint: createDuplicateAiHint({
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
      })
    };

    let insert = await supabase.from("complaints").insert(insertData).select("*").single();
    if (insert.error && isMissingDuplicateColumnsMessage(insert.error.message)) {
      insert = await supabase.from("complaints").insert(insertDataBase).select("*").single();
    }

    if (insert.error || !insert.data) {
      return Response.json({ error: insert.error?.message || "Failed to create complaint." }, { status: 500 });
    }

    const complaint = insert.data as Complaint;
    complaints.push(complaint);

    const logInsert = await supabase.from("status_logs").insert({
      complaint_id: complaint.id,
      old_status: null,
      new_status: "new",
      comment: "Created from Telegram chat"
    });

    if (logInsert.error) {
      return Response.json({ error: logInsert.error.message }, { status: 500 });
    }

    const linkedMessages = payload.messages.filter((message) => group.sourceMessageIds.includes(message.messageId));
    const links = linkedMessages.map((message) => ({
      complaint_id: complaint.id,
      chat_id: payload.chat?.chatId || "",
      message_id: message.messageId,
      telegram_user_id: message.telegramUserId || null,
      raw_message: message.text
    }));

    if (links.length > 0) {
      const linkInsert = await supabase.from("telegram_message_links").insert(links);
      if (linkInsert.error) {
        return Response.json({ error: linkInsert.error.message }, { status: 500 });
      }
    }
  }

  return Response.json(
    {
      complaints,
      filteredMessages: filteredMessages.length,
      groups: groups.length,
      windowId: windowInsert.data.id
    },
    { status: 201 }
  );
}
