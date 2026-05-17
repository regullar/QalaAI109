export type BufferedTelegramMessage = {
  chatId: string;
  messageId: number;
  replyToMessageId?: number | null;
  telegramUserId?: string | null;
  authorName?: string | null;
  text: string;
  date: string;
};

export type CollectionWindow = {
  chatId: string;
  title?: string | null;
  startedAt: string;
  endsAt: string;
  messages: BufferedTelegramMessage[];
};

const MAX_DURATION_MS = 24 * 60 * 60 * 1000;
const NOISE_TEXT = new Set(["+", "+1", "++", "ок", "окей", "ok", "okay", "спасибо", "рахмет"]);

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function shouldCollectText(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  if (normalized.startsWith("/")) return false;
  if (NOISE_TEXT.has(normalized)) return false;
  return normalized.length > 3;
}

export function parseCollectionDuration(value: string | undefined) {
  const match = (value || "").trim().match(/^(\d+)(m|h)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const durationMs = unit === "h" ? amount * 60 * 60 * 1000 : amount * 60 * 1000;

  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_DURATION_MS) return null;
  return durationMs;
}

export function createCollectionStore(now = () => Date.now()) {
  const windows = new Map<string, CollectionWindow>();

  function isActive(window: CollectionWindow) {
    return Date.parse(window.endsAt) > now();
  }

  return {
    startWindow(input: { chatId: string; title?: string | null; durationMs: number }) {
      const startedAtMs = now();
      const window: CollectionWindow = {
        chatId: input.chatId,
        title: input.title || null,
        startedAt: new Date(startedAtMs).toISOString(),
        endsAt: new Date(startedAtMs + input.durationMs).toISOString(),
        messages: []
      };
      windows.set(input.chatId, window);
      return window;
    },

    addMessage(message: BufferedTelegramMessage) {
      const window = windows.get(message.chatId);
      if (!window || !isActive(window)) return false;
      window.messages.push(message);
      return true;
    },

    getWindow(chatId: string) {
      return windows.get(chatId) || null;
    },

    getStatus(chatId: string) {
      const window = windows.get(chatId);
      if (!window) return { isActive: false, count: 0, endsAt: null };
      return {
        isActive: isActive(window),
        count: window.messages.length,
        endsAt: window.endsAt
      };
    },

    stopWindow(chatId: string) {
      const window = windows.get(chatId);
      windows.delete(chatId);
      return window || null;
    }
  };
}
