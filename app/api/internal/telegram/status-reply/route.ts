import { isAuthorizedInternalRequest, formatTelegramStatusReply } from "@/lib/telegram-internal";
import type { ComplaintStatus } from "@/types/complaint";

type StatusReplyRequest = {
  publicId?: string;
  status?: ComplaintStatus;
  comment?: string | null;
};

export async function POST(request: Request) {
  if (!isAuthorizedInternalRequest(request.headers, process.env.BOT_INTERNAL_API_SECRET)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as StatusReplyRequest | null;
  if (!payload?.publicId || !payload.status) {
    return Response.json({ error: "Fields `publicId` and `status` are required." }, { status: 400 });
  }

  return Response.json({
    text: formatTelegramStatusReply({
      publicId: payload.publicId,
      status: payload.status,
      comment: payload.comment || null
    })
  });
}
