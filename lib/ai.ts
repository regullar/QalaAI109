import type { AnalyzeComplaintResponse } from "@/types/complaint";
import { fallbackClassify } from "./fallback-classifier";

type AnalyzeInput = {
  text: string;
  district?: string;
  addressText?: string;
};

function clampConfidence(value: number) {
  if (Number.isNaN(value)) return 0.6;
  return Math.max(0, Math.min(1, value));
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1));
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
}

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toBooleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function toNumberValue(value: unknown, fallback = 0.6) {
  return typeof value === "number" ? clampConfidence(value) : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeAiResponse(
  data: Record<string, unknown>,
  input: AnalyzeInput
): AnalyzeComplaintResponse {
  const fallback = fallbackClassify(input.text, input.district, input.addressText);
  const priority = toStringValue(data.priority, fallback.priority);
  const validPriority =
    priority === "low" || priority === "medium" || priority === "high" || priority === "critical"
      ? priority
      : fallback.priority;

  return {
    title: toStringValue(data.title, fallback.title),
    category: toStringValue(data.category, fallback.category),
    subcategory: toStringValue(data.subcategory, fallback.subcategory),
    district: toStringValue(data.district, fallback.district),
    priority: validPriority,
    addressText: toStringValue(data.addressText, fallback.addressText),
    riskFactors: toStringArray(data.riskFactors),
    summary: toStringValue(data.summary, fallback.summary),
    responsibleService: toStringValue(data.responsibleService, fallback.responsibleService),
    appealText: toStringValue(data.appealText, fallback.appealText),
    needsEmergencyWarning: toBooleanValue(
      data.needsEmergencyWarning,
      fallback.needsEmergencyWarning
    ),
    confidence: toNumberValue(data.confidence, fallback.confidence),
    source: "ai"
  };
}

async function analyzeWithOpenAi(input: AnalyzeInput): Promise<AnalyzeComplaintResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackClassify(input.text, input.district, input.addressText);
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const systemPrompt = `Ты AI-диспетчер городских обращений Шымкента.

Твоя задача - разобрать обращение жителя и вернуть строго JSON без markdown.

Город: Шымкент.

Районы:
- Абайский район
- Аль-Фарабийский район
- Енбекшинский район
- Каратауский район
- район Тұран

Категории:
- Электроснабжение
- Уличное освещение
- Водоснабжение
- Канализация
- Дороги и тротуары
- Светофоры и переходы
- Общественный транспорт
- Остановки
- Мусор и санитария
- Парковка
- Экология и воздух
- Безопасность
- Дворы и благоустройство
- Другое

Верни JSON:
{
  "title": string,
  "category": string,
  "subcategory": string,
  "district": string,
  "priority": "low" | "medium" | "high" | "critical",
  "addressText": string,
  "riskFactors": string[],
  "summary": string,
  "responsibleService": string,
  "appealText": string,
  "needsEmergencyWarning": boolean,
  "confidence": number
}

Правила:
- Не выдумывай точный адрес, если его нет.
- Если район не указан, верни "Не определен".
- Если есть угроза жизни, газ, пожар, ДТП, открытый люк, оголенный провод - priority = critical.
- Если рядом школа, дети, пешеходный переход, светофор, темная улица - priority минимум high.
- Если обращение эмоциональное, перепиши его в официальный деловой текст.
- Если текст не относится к городской проблеме, category = "Другое", priority = "low".
- Ответ только JSON.`;

  const body = {
    model,
    input: [
      { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              text: input.text,
              district: input.district || "",
              addressText: input.addressText || ""
            })
          }
        ]
      }
    ]
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`AI analyze failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const outputText = toStringValue(data.output_text);
  const parsed = parseJsonObject(outputText);

  if (!parsed) {
    throw new Error("AI analyze returned invalid JSON");
  }

  return normalizeAiResponse(parsed, input);
}

export async function analyzeComplaint(input: AnalyzeInput): Promise<AnalyzeComplaintResponse> {
  if (!input.text.trim()) {
    return fallbackClassify(input.text, input.district, input.addressText);
  }

  if (!process.env.OPENAI_API_KEY) {
    return fallbackClassify(input.text, input.district, input.addressText);
  }

  try {
    return await analyzeWithOpenAi(input);
  } catch {
    return fallbackClassify(input.text, input.district, input.addressText);
  }
}
