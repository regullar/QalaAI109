import assert from "node:assert/strict";
import test from "node:test";
import { analyzeComplaint } from "../lib/ai";

test("analyzeComplaint requests strict structured JSON from OpenAI", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_MODEL;
  const previousFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | null = null;

  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_MODEL = "gpt-4o-mini";
  globalThis.fetch = (async (_url, init) => {
    requestBody = JSON.parse(String(init?.body));
    return Response.json({
      output_text: JSON.stringify({
        title: "Бродячие собаки во дворе",
        category: "Безопасность",
        subcategory: "Бродячие животные",
        district: "Каратауский район",
        priority: "high",
        addressText: "Шымкент, микрорайон Астана, 67",
        riskFactors: ["дети рядом"],
        summary: "Жители сообщают о бродячих собаках во дворе.",
        responsibleService: "Ветеринарная служба / служба отлова безнадзорных животных",
        appealText: "Прошу организовать проверку и отлов безнадзорных животных.",
        needsEmergencyWarning: false,
        confidence: 0.86
      })
    });
  }) as typeof fetch;

  try {
    const result = await analyzeComplaint({
      text: "псы бродячие ходят по дворам и кошмарит детей",
      district: "Каратауский район",
      addressText: "Шымкент, микрорайон Астана, 67"
    });

    assert.equal(result.source, "ai");
    assert.equal(result.category, "Безопасность");
    assert.equal((requestBody?.text as { format?: { type?: string; strict?: boolean } } | undefined)?.format?.type, "json_schema");
    assert.equal((requestBody?.text as { format?: { strict?: boolean } } | undefined)?.format?.strict, true);
  } finally {
    if (previousKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousKey;
    }
    if (previousModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = previousModel;
    }
    globalThis.fetch = previousFetch;
  }
});

test("analyzeComplaint reads JSON from Responses API output content", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_MODEL;
  const previousFetch = globalThis.fetch;

  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_MODEL = "gpt-4o-mini";
  globalThis.fetch = (async () =>
    Response.json({
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                title: "Бродячие собаки во дворе",
                category: "Безопасность",
                subcategory: "Бродячие животные",
                district: "Каратауский район",
                priority: "high",
                addressText: "Шымкент, микрорайон Астана, 67",
                riskFactors: ["дети рядом"],
                summary: "Жители сообщают о бродячих собаках во дворе.",
                responsibleService: "Ветеринарная служба / служба отлова безнадзорных животных",
                appealText: "Прошу организовать проверку и отлов безнадзорных животных.",
                needsEmergencyWarning: false,
                confidence: 0.86
              })
            }
          ]
        }
      ]
    })) as typeof fetch;

  try {
    const result = await analyzeComplaint({
      text: "псы бродячие ходят по дворам и кошмарит детей",
      district: "Каратауский район",
      addressText: "Шымкент, микрорайон Астана, 67"
    });

    assert.equal(result.source, "ai");
    assert.equal(result.category, "Безопасность");
    assert.equal(result.subcategory, "Бродячие животные");
  } finally {
    if (previousKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousKey;
    }
    if (previousModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = previousModel;
    }
    globalThis.fetch = previousFetch;
  }
});
