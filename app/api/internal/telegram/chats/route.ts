import { isAuthorizedInternalRequest } from "@/lib/telegram-internal";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RegisterChatRequest = {
  chatId?: string;
  title?: string | null;
};

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

  const supabase = getSupabaseAdminClient();
  await supabase.from("users").upsert({ id: adminUserId, role: "admin" }, { onConflict: "id" });

  const { data, error } = await supabase
    .from("telegram_chats")
    .upsert(
      {
        chat_id: payload.chatId,
        title: payload.title || null,
        added_by_user_id: adminUserId,
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
