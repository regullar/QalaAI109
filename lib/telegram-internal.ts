import type { ComplaintStatus } from "@/types/complaint";

export type TelegramIngestMessage = {
  messageId: number;
  replyToMessageId?: number | null;
  telegramUserId?: string | null;
  authorName?: string | null;
  text: string;
  date: string;
};

export type TelegramComplaintDraft = {
  rawText: string;
  sourceMessageIds: number[];
  primaryMessageId: number;
};

const NOISE_MESSAGES = new Set([
  "+",
  "+1",
  "++",
  "ок",
  "окей",
  "okay",
  "ok",
  "спасибо",
  "рахмет",
  "иә",
  "да",
  "нет",
  "согласен",
  "согласна"
]);

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  new: "новая",
  checking: "проверяется",
  assigned: "передана в службу",
  in_progress: "в работе",
  resolved: "решена",
  rejected: "отклонена"
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getIssueSignature(text: string) {
  const normalized = normalizeText(text);
  if (/(мусор|контейнер|свалк|санитар|қоқыс)/i.test(normalized)) return "trash";
  if (/(фонар|освещ|свет|ламп|жарық)/i.test(normalized)) return "lighting";
  if (/(вода|водоснаб|су |құбыр|труба)/i.test(normalized)) return "water";
  if (/(дорог|асфальт|тротуар|яма|шұңқыр)/i.test(normalized)) return "roads";
  if (/(лифт|подъезд|двор|площадк)/i.test(normalized)) return "yard";
  return null;
}

export function isAuthorizedInternalRequest(headers: Headers, secret: string | undefined) {
  if (!secret) return false;
  const authorization = headers.get("authorization") || "";
  return authorization === `Bearer ${secret}`;
}

export function filterTelegramMessagesForIngest(messages: TelegramIngestMessage[]) {
  return messages.filter((message) => {
    const text = message.text.trim();
    if (!text) return false;
    if (text.startsWith("/")) return false;

    const normalized = normalizeText(text);
    if (NOISE_MESSAGES.has(normalized)) return false;
    if (normalized.length <= 3 && !message.replyToMessageId) return false;

    return true;
  });
}

export function groupTelegramMessagesForComplaints(messages: TelegramIngestMessage[]) {
  const groups: Array<TelegramComplaintDraft & { signature: string | null }> = [];
  const groupByMessageId = new Map<number, (typeof groups)[number]>();
  const groupBySignature = new Map<string, (typeof groups)[number]>();

  for (const message of filterTelegramMessagesForIngest(messages)) {
    const repliedGroup = message.replyToMessageId ? groupByMessageId.get(message.replyToMessageId) : null;
    const signature = getIssueSignature(message.text);
    const signatureGroup = signature ? groupBySignature.get(signature) : null;
    const group = repliedGroup || signatureGroup;

    if (group) {
      group.rawText = `${group.rawText}\n${message.text.trim()}`;
      group.sourceMessageIds.push(message.messageId);
      groupByMessageId.set(message.messageId, group);
      continue;
    }

    const nextGroup = {
      rawText: message.text.trim(),
      sourceMessageIds: [message.messageId],
      primaryMessageId: message.messageId,
      signature
    };
    groups.push(nextGroup);
    groupByMessageId.set(message.messageId, nextGroup);
    if (signature) groupBySignature.set(signature, nextGroup);
  }

  return groups.map(({ signature: _signature, ...group }) => group);
}

export function formatTelegramStatusReply(input: {
  publicId: string;
  status: ComplaintStatus;
  comment?: string | null;
}) {
  const base = `Заявка ${input.publicId}: ${STATUS_LABELS[input.status]}.`;
  const comment = input.comment?.trim();
  return comment ? `${base}\nКомментарий: ${comment}.` : base;
}
