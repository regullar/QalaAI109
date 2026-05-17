import assert from "node:assert/strict";
import test from "node:test";
import { createCollectionStore, parseCollectionDuration, shouldCollectText } from "./message-buffer";

test("parseCollectionDuration supports minutes and hours with bounds", () => {
  assert.equal(parseCollectionDuration("30m"), 30 * 60 * 1000);
  assert.equal(parseCollectionDuration("2h"), 2 * 60 * 60 * 1000);
  assert.equal(parseCollectionDuration("999h"), null);
  assert.equal(parseCollectionDuration("abc"), null);
});

test("collection store records messages only while a window is active", () => {
  const now = new Date("2026-05-17T10:00:00.000Z").getTime();
  const store = createCollectionStore(() => now);

  assert.equal(
    store.addMessage({
      chatId: "-100",
      messageId: 1,
      text: "Мусор не вывозят",
      date: "2026-05-17T10:00:00.000Z"
    }),
    false
  );

  store.startWindow({ chatId: "-100", title: "ЖК Test", durationMs: 30 * 60 * 1000 });

  assert.equal(
    store.addMessage({
      chatId: "-100",
      messageId: 2,
      text: "Мусор не вывозят уже неделю",
      date: "2026-05-17T10:01:00.000Z"
    }),
    true
  );

  const stopped = store.stopWindow("-100");
  assert.equal(stopped?.messages.length, 1);
  assert.equal(store.getStatus("-100")?.isActive, false);
});

test("shouldCollectText skips commands and short chat noise", () => {
  assert.equal(shouldCollectText("/qala_status"), false);
  assert.equal(shouldCollectText("ок"), false);
  assert.equal(shouldCollectText("+1"), false);
  assert.equal(shouldCollectText("Возле дома не работает освещение"), true);
});
