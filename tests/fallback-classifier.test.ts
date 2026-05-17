import assert from "node:assert/strict";
import test from "node:test";
import { fallbackClassify } from "../lib/fallback-classifier";

test("fallbackClassify preserves the complaint problem for unknown categories", () => {
  const result = fallbackClassify("Во дворе сломана детская качеля, дети могут упасть");

  assert.notEqual(result.summary, "Обращение требует ручной проверки оператором.");
  assert.match(result.summary, /сломана детская качеля/);
  assert.match(result.appealText, /сломана детская качеля/);
});
