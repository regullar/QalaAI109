export type PendingChatSetup = {
  chatId: string;
  title?: string | null;
  startedAt: string;
};

export function createChatSetupStore() {
  const pending = new Map<string, PendingChatSetup>();

  return {
    beginSetup(input: { chatId: string; title?: string | null }) {
      const state: PendingChatSetup = {
        chatId: input.chatId,
        title: input.title || null,
        startedAt: new Date().toISOString()
      };
      pending.set(input.chatId, state);
      return state;
    },

    isAwaiting(chatId: string) {
      return pending.has(chatId);
    },

    get(chatId: string) {
      return pending.get(chatId) || null;
    },

    completeSetup(chatId: string) {
      pending.delete(chatId);
    }
  };
}
