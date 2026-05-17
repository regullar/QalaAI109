import assert from "node:assert/strict";
import test from "node:test";
import { createChatSetupStore } from "./chat-setup-store.js";

test("chat setup store tracks pending setup until completion", () => {
  const store = createChatSetupStore();

  assert.equal(store.isAwaiting("-100"), false);
  store.beginSetup({ chatId: "-100", title: "ЖК Test" });
  assert.equal(store.isAwaiting("-100"), true);
  assert.equal(store.get("-100")?.title, "ЖК Test");

  store.completeSetup("-100");
  assert.equal(store.isAwaiting("-100"), false);
  assert.equal(store.get("-100"), null);
});
