import { CATEGORIES } from "@/lib/constants";
import type { AnalyzeComplaintResponse, ComplaintPriority } from "@/types/complaint";

type ClassifierContext = {
  text: string;
  district?: string;
  addressText?: string;
};

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function createFallbackProblemText(text: string) {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/^[-–—•\s]+/, "")
    .trim();

  if (!cleaned) return "Требуется ручная проверка городского обращения.";

  const firstSentence = cleaned.match(/^.{1,180}?(?:[.!?]|$)/)?.[0]?.trim() || cleaned.slice(0, 180).trim();
  const normalizedEnd = /[.!?]$/.test(firstSentence) ? firstSentence : `${firstSentence}.`;
  return `Житель сообщает: ${normalizedEnd}`;
}

function createBaseResponse(context: ClassifierContext): AnalyzeComplaintResponse {
  const district = context.district?.trim() || "Не определен";
  const addressText = context.addressText?.trim() || "";
  const problemText = createFallbackProblemText(context.text);

  return {
    title: "Городское обращение",
    category: "Другое",
    subcategory: "Общее обращение",
    district,
    priority: "low",
    addressText,
    riskFactors: [],
    summary: problemText,
    responsibleService: "Общая городская служба",
    appealText: `Прошу рассмотреть обращение и передать его ответственной городской службе. ${problemText}`,
    needsEmergencyWarning: false,
    confidence: 0.62,
    source: "fallback"
  };
}

function safeCategory(category: string) {
  return CATEGORIES.includes(category as (typeof CATEGORIES)[number]) ? category : "Другое";
}

function finalize(
  response: AnalyzeComplaintResponse,
  category: string,
  priority: ComplaintPriority,
  title: string,
  summary: string,
  service: string,
  riskFactors: string[],
  subcategory: string,
  needsEmergencyWarning = false,
  confidence = 0.72
) {
  response.category = safeCategory(category);
  response.priority = priority;
  response.title = title;
  response.summary = summary;
  response.responsibleService = service;
  response.riskFactors = riskFactors;
  response.subcategory = subcategory;
  response.needsEmergencyWarning = needsEmergencyWarning;
  response.confidence = confidence;
  const appealSubject = title === "Городское обращение" ? summary : title;
  response.appealText = `Прошу проверить и устранить проблему: ${appealSubject.replace(/[.!?]+$/, "")}.`;
}

export function fallbackClassify(
  text: string,
  district?: string,
  addressText?: string
): AnalyzeComplaintResponse {
  const normalized = text.toLowerCase();
  const response = createBaseResponse({ text, district, addressText });

  const mentionsChildren = includesAny(normalized, [
    "дет",
    "дети",
    "ребен",
    "школ",
    "оқушы",
    "мектеп",
    "children",
    "kid",
    "school"
  ]);
  const mentionsDark = includesAny(normalized, ["темно", "қараңғы", "dark", "night", "вечер"]);

  if (
    includesAny(normalized, [
      "газ",
      "gas",
      "пожар",
      "өрт",
      "fire",
      "дтп",
      "авария",
      "crash",
      "accident",
      "люк",
      "құдық",
      "manhole",
      "open hatch",
      "провод",
      "сым",
      "оголен",
      "оголён",
      "exposed wire",
      "искрит",
      "spark",
      "угроза",
      "қауіп"
    ])
  ) {
    finalize(
      response,
      "Безопасность",
      "critical",
      "Критический риск для безопасности",
      "В обращении обнаружены признаки непосредственной опасности.",
      "Служба безопасности и экстренного реагирования",
      ["угроза жизни или здоровью"],
      "Непосредственная опасность",
      true,
      0.86
    );
    return response;
  }

  if (includesAny(normalized, ["светофор", "бағдаршам", "переход", "crossing", "traffic light"])) {
    finalize(
      response,
      "Светофоры и переходы",
      mentionsChildren ? "high" : "medium",
      "Проблема со светофором или переходом",
      "Нужна проверка светофора, перехода или организации движения.",
      "Служба организации дорожного движения",
      mentionsChildren ? ["дети или школа рядом", "риск для пешеходов"] : ["риск для пешеходов"],
      "Светофор или пешеходный переход",
      false,
      0.8
    );
    return response;
  }

  if (
    includesAny(normalized, [
      "фонар",
      "освещ",
      "жарық",
      "темно",
      "қараңғы",
      "lamp",
      "street light",
      "lighting",
      "dark"
    ])
  ) {
    finalize(
      response,
      "Уличное освещение",
      mentionsChildren || mentionsDark ? "high" : "medium",
      "Не работает уличное освещение",
      "Житель сообщает о проблеме с освещением, влияющей на безопасность пешеходов.",
      "Районный акимат / служба уличного освещения",
      [
        ...(mentionsChildren ? ["дети", "школа"] : []),
        ...(mentionsDark ? ["темное место"] : [])
      ],
      "Не работают фонари",
      false,
      0.82
    );
    return response;
  }

  if (includesAny(normalized, ["электр", "свет", "жарық жоқ", "power", "electricity", "outage", "voltage"])) {
    finalize(
      response,
      "Электроснабжение",
      "high",
      "Проблема с электроснабжением",
      "Сообщается о перебоях или отсутствии электричества.",
      "Энергоснабжающая организация",
      ["перебой коммунальной услуги"],
      "Отключение или нестабильное напряжение",
      false,
      0.79
    );
    return response;
  }

  if (includesAny(normalized, ["вода", "су", "канализация", "water", "sewer"])) {
    finalize(
      response,
      includesAny(normalized, ["канализация", "sewer"]) ? "Канализация" : "Водоснабжение",
      "high",
      "Проблема с водой или канализацией",
      "Нужна проверка коммунальной инфраструктуры водоснабжения или канализации.",
      "Водоканал / коммунальная служба",
      ["перебой коммунальной услуги"],
      "Коммунальная авария",
      false,
      0.76
    );
    return response;
  }

  if (includesAny(normalized, ["яма", "асфальт", "дорог", "тротуар", "жол", "pothole", "road", "sidewalk"])) {
    finalize(
      response,
      "Дороги и тротуары",
      mentionsChildren ? "high" : "medium",
      "Повреждение дороги или тротуара",
      "Обнаружена проблема с дорожным покрытием или пешеходной зоной.",
      "Дорожная эксплуатационная служба",
      mentionsChildren ? ["дети или школа рядом"] : [],
      "Повреждение покрытия",
      false,
      0.74
    );
    return response;
  }

  if (includesAny(normalized, ["автобус", "маршрут", "останов", "қоғамдық көлік", "bus", "route", "stop"])) {
    finalize(
      response,
      "Общественный транспорт",
      "medium",
      "Проблема с общественным транспортом",
      "Сообщается о проблеме маршрута, остановки или интервала движения.",
      "Управление пассажирского транспорта",
      [],
      "Маршрут или остановка",
      false,
      0.73
    );
    return response;
  }

  if (includesAny(normalized, ["мусор", "қоқыс", "убор", "контейнер", "trash", "garbage", "waste"])) {
    finalize(
      response,
      "Мусор и санитария",
      "medium",
      "Проблема с мусором или санитарией",
      "Нужно проверить вывоз мусора или санитарное состояние территории.",
      "Служба санитарной очистки",
      [],
      "Вывоз мусора",
      false,
      0.73
    );
    return response;
  }

  finalize(
    response,
    "Другое",
    "low",
    "Городское обращение",
    createFallbackProblemText(text),
    "Общая городская служба",
    [],
    "Общее обращение",
    false,
    0.62
  );

  return response;
}
