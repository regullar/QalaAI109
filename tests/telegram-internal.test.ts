import assert from "node:assert/strict";
import test from "node:test";
import {
  filterTelegramMessagesForIngest,
  formatTelegramStatusReply,
  groupTelegramMessagesForComplaints,
  isAuthorizedInternalRequest
} from "../lib/telegram-internal";

test("isAuthorizedInternalRequest accepts only bearer token matching configured secret", () => {
  assert.equal(
    isAuthorizedInternalRequest(new Headers({ authorization: "Bearer test-secret" }), "test-secret"),
    true
  );
  assert.equal(
    isAuthorizedInternalRequest(new Headers({ authorization: "Bearer wrong" }), "test-secret"),
    false
  );
  assert.equal(isAuthorizedInternalRequest(new Headers(), "test-secret"), false);
});

test("filterTelegramMessagesForIngest removes commands and short noise", () => {
  const filtered = filterTelegramMessagesForIngest([
    { messageId: 1, text: "/qala_status", date: "2026-05-17T10:00:00.000Z" },
    { messageId: 2, text: "ок", date: "2026-05-17T10:01:00.000Z" },
    { messageId: 3, text: "+1", date: "2026-05-17T10:02:00.000Z" },
    { messageId: 4, text: "У нас мусор уже неделю не вывозят возле подъезда", date: "2026-05-17T10:03:00.000Z" }
  ]);

  assert.deepEqual(
    filtered.map((item) => item.messageId),
    [4]
  );
});

test("groupTelegramMessagesForComplaints combines reply chains and similar text into one complaint draft", () => {
  const groups = groupTelegramMessagesForComplaints([
    { messageId: 10, text: "Мусор не вывозят уже неделю", date: "2026-05-17T10:00:00.000Z" },
    {
      messageId: 11,
      replyToMessageId: 10,
      text: "Да, контейнеры переполнены возле 3 подъезда",
      date: "2026-05-17T10:01:00.000Z"
    },
    { messageId: 12, text: "Во дворе не горит фонарь", date: "2026-05-17T10:02:00.000Z" }
  ]);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].sourceMessageIds, [10, 11]);
  assert.match(groups[0].rawText, /Мусор не вывозят/);
  assert.match(groups[0].rawText, /контейнеры переполнены/);
});

test("formatTelegramStatusReply returns official short message with optional comment", () => {
  assert.equal(
    formatTelegramStatusReply({
      publicId: "SH-109-20260517-123456",
      status: "in_progress",
      comment: "Работы по обращению начаты"
    }),
    "Заявка SH-109-20260517-123456: в работе.\nКомментарий: Работы по обращению начаты."
  );

  assert.equal(
    formatTelegramStatusReply({
      publicId: "SH-109-20260517-123456",
      status: "resolved",
      comment: null
    }),
    "Заявка SH-109-20260517-123456: решена."
  );
});
