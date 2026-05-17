const MAX_DURATION_MS = 24 * 60 * 60 * 1000;
const NOISE_TEXT = new Set(["+", "+1", "++", "ок", "окей", "ok", "okay", "спасибо", "рахмет"]);
function normalizeText(value) {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
}
export function shouldCollectText(text) {
    const normalized = normalizeText(text);
    if (!normalized)
        return false;
    if (normalized.startsWith("/"))
        return false;
    if (NOISE_TEXT.has(normalized))
        return false;
    return normalized.length > 3;
}
export function parseCollectionDuration(value) {
    const match = (value || "").trim().match(/^(\d+)(m|h)$/i);
    if (!match)
        return null;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const durationMs = unit === "h" ? amount * 60 * 60 * 1000 : amount * 60 * 1000;
    if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_DURATION_MS)
        return null;
    return durationMs;
}
export function createCollectionStore(now = () => Date.now()) {
    const windows = new Map();
    function isActive(window) {
        return Date.parse(window.endsAt) > now();
    }
    return {
        startWindow(input) {
            const startedAtMs = now();
            const window = {
                chatId: input.chatId,
                title: input.title || null,
                startedAt: new Date(startedAtMs).toISOString(),
                endsAt: new Date(startedAtMs + input.durationMs).toISOString(),
                messages: []
            };
            windows.set(input.chatId, window);
            return window;
        },
        addMessage(message) {
            const window = windows.get(message.chatId);
            if (!window || !isActive(window))
                return false;
            window.messages.push(message);
            return true;
        },
        getWindow(chatId) {
            return windows.get(chatId) || null;
        },
        getStatus(chatId) {
            const window = windows.get(chatId);
            if (!window)
                return { isActive: false, count: 0, endsAt: null };
            return {
                isActive: isActive(window),
                count: window.messages.length,
                endsAt: window.endsAt
            };
        },
        stopWindow(chatId) {
            const window = windows.get(chatId);
            windows.delete(chatId);
            return window || null;
        }
    };
}
