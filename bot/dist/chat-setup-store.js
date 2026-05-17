export function createChatSetupStore() {
    const pending = new Map();
    return {
        beginSetup(input) {
            const state = {
                chatId: input.chatId,
                title: input.title || null,
                startedAt: new Date().toISOString()
            };
            pending.set(input.chatId, state);
            return state;
        },
        isAwaiting(chatId) {
            return pending.has(chatId);
        },
        get(chatId) {
            return pending.get(chatId) || null;
        },
        completeSetup(chatId) {
            pending.delete(chatId);
        }
    };
}
