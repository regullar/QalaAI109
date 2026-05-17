import { isAuthorizedInternalRequest } from "@/lib/telegram-internal";
import {
  inferComplaintCoordinates,
  resolveAddressQueryWithTwoGis,
  resolveLocationFromTwoGis
} from "@/lib/locations";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RegisterChatRequest = {
  chatId?: string;
  title?: string | null;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function parseNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function GET(request: Request) {
  if (!isAuthorizedInternalRequest(request.headers, process.env.BOT_INTERNAL_API_SECRET)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  if (!chatId) {
    return Response.json({ error: "Query `chatId` is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("telegram_chats").select("*").eq("chat_id", chatId).maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json({ error: "Chat is not configured." }, { status: 404 });
  }

  return Response.json({ chat: data }, { status: 200 });
}

export async function POST(request: Request) {
  if (!isAuthorizedInternalRequest(request.headers, process.env.BOT_INTERNAL_API_SECRET)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as RegisterChatRequest | null;
  if (!payload?.chatId) {
    return Response.json({ error: "Field `chatId` is required." }, { status: 400 });
  }

  const adminUserId = process.env.BOT_DEFAULT_ADMIN_USER_ID;
  if (!adminUserId) {
    return Response.json({ error: "BOT_DEFAULT_ADMIN_USER_ID is not configured." }, { status: 503 });
  }

  const addressText = payload.addressText?.trim() || null;
  const latitude = parseNullableNumber(payload.latitude);
  const longitude = parseNullableNumber(payload.longitude);
  if (!addressText && (latitude === null || longitude === null)) {
    return Response.json(
      { error: "Either `addressText` or both `latitude` and `longitude` are required." },
      { status: 400 }
    );
  }

  const twoGisKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;
  if (!twoGisKey) {
    return Response.json({ error: "2GIS API key is not configured." }, { status: 503 });
  }

  let resolvedDistrict: string | null = null;
  let resolvedAddressText: string | null = addressText;
  let resolvedLatitude = latitude;
  let resolvedLongitude = longitude;

  try {
    if (resolvedLatitude !== null && resolvedLongitude !== null) {
      const location = await resolveLocationFromTwoGis({
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        key: twoGisKey,
        locale: "ru_KZ"
      });
      resolvedDistrict = location.district;
      resolvedAddressText = location.addressText || resolvedAddressText;
    } else if (addressText) {
      const geocoded = await resolveAddressQueryWithTwoGis({
        query: addressText,
        key: twoGisKey,
        locale: "ru_KZ"
      });
      const fallback = inferComplaintCoordinates({ addressText, district: geocoded.district });
      resolvedDistrict = geocoded.district;
      resolvedAddressText = geocoded.addressText || addressText;
      resolvedLatitude = geocoded.latitude ?? fallback.latitude;
      resolvedLongitude = geocoded.longitude ?? fallback.longitude;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve chat location.";
    return Response.json({ error: message }, { status: 502 });
  }

  const supabase = getSupabaseAdminClient();
  await supabase.from("users").upsert({ id: adminUserId, role: "admin" }, { onConflict: "id" });

  const { data, error } = await supabase
    .from("telegram_chats")
    .upsert(
      {
        chat_id: payload.chatId,
        title: payload.title || null,
        added_by_user_id: adminUserId,
        address_text: resolvedAddressText,
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        district: resolvedDistrict,
        is_active: true
      },
      { onConflict: "chat_id" }
    )
    .select("*")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ chat: data }, { status: 200 });
}
