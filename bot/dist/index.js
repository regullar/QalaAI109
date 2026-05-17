import { Bot } from "grammy";
import { createCollectionStore, parseCollectionDuration, shouldCollectText } from "./message-buffer.js";
const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_INTERNAL_URL || "http://localhost:3000";
const internalSecret = process.env.BOT_INTERNAL_API_SECRET;
if (!token) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN");
}
if (!internalSecret) {
    throw new Error("Missing BOT_INTERNAL_API_SECRET");
}
const bot = new Bot(token);
const store = createCollectionStore();
async function postJson(path, body) {
    const response = await fetch(`${webAppUrl.replace(/\/$/, "")}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${internalSecret}`
        },
        body: JSON.stringify(body)
    });
    const data = (await response.json().catch(() => ({})));
    if (!response.ok) {
        throw new Error(data.error || `Request failed with ${response.status}`);
    }
    return data;
}
async function flushWindow(chatId) {
    const window = store.stopWindow(chatId);
    if (!window)
        return { complaints: [], skipped: true };
    const payload = {
        chat: {
            chatId: window.chatId,
            title: window.title || null
        },
        window: {
            startedAt: window.startedAt,
            endedAt: new Date().toISOString()
        },
        messages: window.messages.map((message) => ({
            messageId: message.messageId,
            replyToMessageId: message.replyToMessageId || null,
            telegramUserId: message.telegramUserId || null,
            authorName: message.authorName || null,
            text: message.text,
            date: message.date
        }))
    };
    return postJson("/api/internal/telegram/ingest", payload);
}
bot.command("qala_start", async (ctx) => {
    await postJson("/api/internal/telegram/chats", {
        chatId: String(ctx.chat.id),
        title: ctx.chat.title || ctx.chat.first_name || "Telegram chat"
    });
    await ctx.reply("QalaAI bot подключен к этому чату.");
});
bot.command("qala_collect", async (ctx) => {
    const durationArg = ctx.match?.trim() || "30m";
    const durationMs = parseCollectionDuration(durationArg);
    if (!durationMs) {
        await ctx.reply("Укажите период в формате 30m или 2h. Максимум 24h.");
        return;
    }
    const window = store.startWindow({
        chatId: String(ctx.chat.id),
        title: ctx.chat.title || null,
        durationMs
    });
    setTimeout(() => {
        flushWindow(window.chatId).catch((error) => {
            console.error("Failed to flush Telegram collection window", error);
        });
    }, durationMs);
    await ctx.reply(`Сбор сообщений включен до ${new Date(window.endsAt).toLocaleString("ru-KZ")}.`);
});
bot.command("qala_collect_stop", async (ctx) => {
    try {
        const result = await flushWindow(String(ctx.chat.id));
        const count = Array.isArray(result.complaints) ? result.complaints.length : 0;
        await ctx.reply(`Сбор остановлен. Создано обращений: ${count}.`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await ctx.reply(`Не удалось отправить сообщения на сайт: ${message}`);
    }
});
bot.command("qala_status", async (ctx) => {
    const status = store.getStatus(String(ctx.chat.id));
    if (!status.isActive) {
        await ctx.reply("Активного окна сбора нет.");
        return;
    }
    await ctx.reply(`Сбор активен. Сообщений: ${status.count}. До: ${new Date(status.endsAt || "").toLocaleString("ru-KZ")}.`);
});
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    if (!shouldCollectText(text))
        return;
    store.addMessage({
        chatId: String(ctx.chat.id),
        messageId: ctx.message.message_id,
        replyToMessageId: ctx.message.reply_to_message?.message_id || null,
        telegramUserId: ctx.from?.id ? String(ctx.from.id) : null,
        authorName: [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ") || ctx.from?.username || null,
        text,
        date: new Date(ctx.message.date * 1000).toISOString()
    });
});
bot.catch((error) => {
    console.error("Telegram bot error", error);
});
bot.start({
    onStart: (botInfo) => {
        console.log(`QalaAI Telegram bot started as @${botInfo.username}`);
    }
});
