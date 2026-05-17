import type { AnalyzeComplaintResponse, Complaint } from "@/types/complaint";
import { CATEGORIES, DISTRICTS } from "./constants";
import { fallbackClassify } from "./fallback-classifier";
import { computeComplaintFingerprint } from "./duplicates";

type AnalyzeInput = {
  text: string;
  district?: string;
  addressText?: string;
};

type AnalyzeOptions = {
  fallbackOnError?: boolean;
};

type DuplicateCompareResult = {
  same_issue: boolean;
  confidence: number;
  reason_code: string;
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

function extractResponseText(data: Record<string, unknown>) {
  const directOutputText = toStringValue(data.output_text);
  if (directOutputText) return directOutputText;

  const output = data.output;
  if (!Array.isArray(output)) return "";

  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = toStringValue((part as { text?: unknown }).text);
      if (text) chunks.push(text);
    }
  }

  return chunks.join("\n").trim();
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
    throw new Error("OpenAI API key is not configured.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const systemPrompt = `Ты AI-диспетчер городских обращений Шымкента.

Твоя задача - разобрать короткое, часто неформальное обращение жителя и вернуть структурированный JSON.
Текст может прийти из Telegram-чата жильцов: там могут быть сленг, ошибки, разговорные слова и мало контекста.
Даже если текст короткий, выдели городскую проблему, категорию, направление/ответственную службу, приоритет, резюме и официальный текст.

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
- Если район или адрес переданы во входных данных, сохрани их, если текст явно не противоречит.
- Если есть угроза жизни, газ, пожар, ДТП, открытый люк, оголенный провод - priority = critical.
- Если рядом школа, дети, пешеходный переход, светофор, темная улица - priority минимум high.
- Если обращение про бродячих собак или животных во дворах, category = "Безопасность", subcategory = "Бродячие животные", responsibleService = "Ветеринарная служба / служба отлова безнадзорных животных"; если рядом дети, priority минимум high.
- Для слов "псы", "собаки", "бродячие", "кошмарят детей", "пугают детей" классифицируй как проблему безопасности, а не как "Другое".
- Если обращение эмоциональное, перепиши его в официальный деловой текст, но не теряй суть проблемы.
- summary должен быть конкретным описанием проблемы, не общая фраза про ручную проверку.
- appealText должен быть официальным текстом заявки для городской службы.
- Если текст не относится к городской проблеме, category = "Другое", priority = "low".
- Ответ только JSON.`;

  const responseSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      category: { type: "string", enum: [...CATEGORIES] },
      subcategory: { type: "string" },
      district: { type: "string", enum: [...DISTRICTS, "Не определен"] },
      priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
      addressText: { type: "string" },
      riskFactors: {
        type: "array",
        items: { type: "string" }
      },
      summary: { type: "string" },
      responsibleService: { type: "string" },
      appealText: { type: "string" },
      needsEmergencyWarning: { type: "boolean" },
      confidence: { type: "number" }
    },
    required: [
      "title",
      "category",
      "subcategory",
      "district",
      "priority",
      "addressText",
      "riskFactors",
      "summary",
      "responsibleService",
      "appealText",
      "needsEmergencyWarning",
      "confidence"
    ]
  };

  const body = {
    model,
    text: {
      format: {
        type: "json_schema",
        name: "complaint_analysis",
        strict: true,
        schema: responseSchema
      }
    },
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
    const errorText = await response.text().catch(() => "");
    const detail = errorText ? `: ${errorText.slice(0, 300)}` : "";
    throw new Error(`OpenAI analyze failed with status ${response.status}${detail}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const outputText = extractResponseText(data);
  const parsed = parseJsonObject(outputText);

  if (!parsed) {
    const detail = outputText ? `: ${outputText.slice(0, 300)}` : "";
    throw new Error(`AI analyze returned invalid JSON${detail}`);
  }

  return normalizeAiResponse(parsed, input);
}

async function callResponsesApi(body: object) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`OpenAI responses call failed: ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

function normalizeDuplicateCompareResult(data: Record<string, unknown>): DuplicateCompareResult {
  return {
    same_issue: toBooleanValue(data.same_issue, false),
    confidence: toNumberValue(data.confidence, 0.5),
    reason_code: toStringValue(data.reason_code, "unknown")
  };
}

export async function compareDuplicateComplaintsWithAi(
  left: Pick<
    Complaint,
    | "id"
    | "public_id"
    | "category"
    | "subcategory"
    | "district"
    | "address_text"
    | "title"
    | "summary"
    | "raw_text"
    | "latitude"
    | "longitude"
    | "normalized_address"
    | "normalized_title"
    | "normalized_summary"
    | "normalized_text"
    | "duplicate_geo_bucket"
    | "duplicate_ai_hint"
  >,
  right: Pick<
    Complaint,
    | "id"
    | "public_id"
    | "category"
    | "subcategory"
    | "district"
    | "address_text"
    | "title"
    | "summary"
    | "raw_text"
    | "latitude"
    | "longitude"
    | "normalized_address"
    | "normalized_title"
    | "normalized_summary"
    | "normalized_text"
    | "duplicate_geo_bucket"
    | "duplicate_ai_hint"
  >
): Promise<DuplicateCompareResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const leftFingerprint = computeComplaintFingerprint(left);
  const rightFingerprint = computeComplaintFingerprint(right);

  const body = {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `Ты оцениваешь, относятся ли два городских обращения к одной и той же проблеме в Шымкенте.

Верни строго JSON:
{
  "same_issue": boolean,
  "confidence": number,
  "reason_code": string
}

Правила:
- Приоритет у места и категории, а не у слов.
- Если категории разные, почти всегда same_issue = false.
- Если координаты сильно отличаются, same_issue = false.
- Если адреса конфликтуют и не указывают на одну точку, same_issue = false.
- Если смысл совпадает, место совпадает или очень близко, а проблема одна и та же, same_issue = true.
- confidence от 0 до 1.
- reason_code одно короткое snake_case значение.`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              left: {
                id: left.id,
                public_id: left.public_id,
                category: left.category,
                subcategory: left.subcategory,
                district: left.district,
                address_text: left.address_text,
                normalized_address: leftFingerprint.normalizedAddress,
                title: left.title,
                summary: left.summary,
                raw_text: left.raw_text,
                normalized_text: leftFingerprint.normalizedText,
                latitude: left.latitude,
                longitude: left.longitude,
                geo_bucket: leftFingerprint.duplicateGeoBucket,
                signature: leftFingerprint.signature
              },
              right: {
                id: right.id,
                public_id: right.public_id,
                category: right.category,
                subcategory: right.subcategory,
                district: right.district,
                address_text: right.address_text,
                normalized_address: rightFingerprint.normalizedAddress,
                title: right.title,
                summary: right.summary,
                raw_text: right.raw_text,
                normalized_text: rightFingerprint.normalizedText,
                latitude: right.latitude,
                longitude: right.longitude,
                geo_bucket: rightFingerprint.duplicateGeoBucket,
                signature: rightFingerprint.signature
              }
            })
          }
        ]
      }
    ]
  };

  try {
    const data = await callResponsesApi(body);
    const outputText = extractResponseText(data);
    const parsed = parseJsonObject(outputText);
    if (!parsed) return null;
    return normalizeDuplicateCompareResult(parsed);
  } catch {
    return null;
  }
}

export async function analyzeComplaint(input: AnalyzeInput): Promise<AnalyzeComplaintResponse> {
  return analyzeComplaintWithOptions(input);
}

export async function analyzeComplaintWithOptions(
  input: AnalyzeInput,
  options: AnalyzeOptions = {}
): Promise<AnalyzeComplaintResponse> {
  const fallbackOnError = options.fallbackOnError ?? true;

  if (!input.text.trim()) {
    if (!fallbackOnError) {
      throw new Error("Complaint text is empty.");
    }
    return fallbackClassify(input.text, input.district, input.addressText);
  }

  if (!process.env.OPENAI_API_KEY) {
    if (!fallbackOnError) {
      throw new Error("OpenAI API key is not configured.");
    }
    return fallbackClassify(input.text, input.district, input.addressText);
  }

  try {
    return await analyzeWithOpenAi(input);
  } catch (error) {
    if (!fallbackOnError) {
      throw error;
    }
    return fallbackClassify(input.text, input.district, input.addressText);
  }
}
