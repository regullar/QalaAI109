import type { ComplaintStatus } from "@/types/complaint";
import { formatTelegramStatusReply } from "./telegram-internal";

export async function sendTelegramStatusReply(input: {
  botToken?: string;
  chatId: string;
  messageId: number;
  publicId: string;
  status: ComplaintStatus;
  comment?: string | null;
}) {
  if (!input.botToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN");
  }

  const text = formatTelegramStatusReply({
    publicId: input.publicId,
    status: input.status,
    comment: input.comment
  });

  const response = await fetch(`https://api.telegram.org/bot${input.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: input.chatId,
      text,
      reply_parameters: {
        message_id: input.messageId
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed with ${response.status}`);
  }

  return text;
}
