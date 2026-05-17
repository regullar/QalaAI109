import type { Language } from "./i18n";

const DISTRICT_LABELS_KK: Record<string, string> = {
  "Абайский район": "Абай ауданы",
  "Аль-Фарабийский район": "Әл-Фараби ауданы",
  "Енбекшинский район": "Еңбекші ауданы",
  "Каратауский район": "Қаратау ауданы",
  "район Тұран": "Тұран ауданы",
  "Не определен": "Анықталмаған"
};

const CATEGORY_LABELS_KK: Record<string, string> = {
  "Электроснабжение": "Электрмен жабдықтау",
  "Уличное освещение": "Көше жарығы",
  "Водоснабжение": "Сумен жабдықтау",
  "Канализация": "Кәріз",
  "Дороги и тротуары": "Жолдар мен тротуарлар",
  "Светофоры и переходы": "Бағдаршамдар мен өткелдер",
  "Общественный транспорт": "Қоғамдық көлік",
  "Остановки": "Аялдамалар",
  "Мусор и санитария": "Қоқыс және санитария",
  "Парковка": "Тұрақ",
  "Экология и воздух": "Экология және ауа",
  "Безопасность": "Қауіпсіздік",
  "Дворы и благоустройство": "Аулалар және абаттандыру",
  "Другое": "Басқа"
};

const SOURCE_LABELS_KK: Record<string, string> = {
  Web: "Веб",
  "109 Demo": "109 демо",
  "WhatsApp Demo": "WhatsApp демо",
  "Telegram Demo": "Telegram демо",
  "Mobile App Demo": "Мобильді қосымша демо",
  web: "Веб"
};

export function formatDistrict(value: string | null | undefined, language: Language) {
  if (!value) return language === "kk" ? "Анықталмаған" : "Не определен";
  return language === "kk" ? DISTRICT_LABELS_KK[value] || value : value;
}

export function formatCategory(value: string | null | undefined, language: Language) {
  if (!value) return language === "kk" ? "Басқа" : "Другое";
  return language === "kk" ? CATEGORY_LABELS_KK[value] || value : value;
}

export function formatSource(value: string | null | undefined, language: Language) {
  if (!value) return language === "kk" ? "Веб" : "Веб";
  if (language === "kk") return SOURCE_LABELS_KK[value] || value;
  if (value === "web" || value === "Web") return "Веб";
  return value.replace("Demo", "демо").replace("Mobile App", "Мобильное приложение");
}
