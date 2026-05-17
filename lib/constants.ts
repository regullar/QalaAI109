export const DISTRICTS = [
  "Абайский район",
  "Аль-Фарабийский район",
  "Енбекшинский район",
  "Каратауский район",
  "район Тұран"
] as const;

export const CATEGORIES = [
  "Электроснабжение",
  "Уличное освещение",
  "Водоснабжение",
  "Канализация",
  "Дороги и тротуары",
  "Светофоры и переходы",
  "Общественный транспорт",
  "Остановки",
  "Мусор и санитария",
  "Парковка",
  "Экология и воздух",
  "Безопасность",
  "Дворы и благоустройство",
  "Другое"
] as const;

export const SOURCES = [
  "Web",
  "Telegram",
  "109 Demo",
  "WhatsApp Demo",
  "Telegram Demo",
  "Mobile App Demo"
] as const;

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const STATUSES = [
  "new",
  "checking",
  "assigned",
  "in_progress",
  "resolved",
  "rejected"
] as const;

export const SHYMKENT_CENTER = {
  lat: 42.3417,
  lng: 69.5901
} as const;

export const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
  low: "Низкий / Төмен",
  medium: "Средний / Орташа",
  high: "Высокий / Жоғары",
  critical: "Критичный / Шұғыл"
};

export const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  new: "Новая / Жаңа",
  checking: "Проверяется / Тексерілуде",
  assigned: "Передана в службу / Қызметке жіберілді",
  in_progress: "В работе / Жұмыста",
  resolved: "Решена / Шешілді",
  rejected: "Отклонена / Қабылданбады"
};

export const DEMO_LOCATION_PRESETS = [
  {
    names: ["нурсат", "nursat"],
    district: "Аль-Фарабийский район",
    addressText: "мкр Нурсат",
    latitude: 42.3438,
    longitude: 69.5886
  },
  {
    names: ["самал", "samal"],
    district: "Абайский район",
    addressText: "мкр Самал",
    latitude: 42.3372,
    longitude: 69.6011
  },
  {
    names: ["кайтпас", "қайтпас", "kaytpas"],
    district: "Каратауский район",
    addressText: "мкр Кайтпас",
    latitude: 42.3542,
    longitude: 69.5778
  },
  {
    names: ["тұран", "туран", "turan"],
    district: "район Тұран",
    addressText: "район Тұран",
    latitude: 42.3312,
    longitude: 69.6111
  },
  {
    names: ["асар", "asar"],
    district: "Каратауский район",
    addressText: "мкр Асар",
    latitude: 42.3485,
    longitude: 69.5705
  },
  {
    names: ["центр", "central", "center"],
    district: "Аль-Фарабийский район",
    addressText: "Центр",
    latitude: 42.3401,
    longitude: 69.5961
  }
] as const;

export const DISTRICT_COORDINATES: Record<
  (typeof DISTRICTS)[number],
  { latitude: number; longitude: number }
> = {
  "Абайский район": { latitude: 42.3372, longitude: 69.6011 },
  "Аль-Фарабийский район": { latitude: 42.3401, longitude: 69.5961 },
  "Енбекшинский район": { latitude: 42.3254, longitude: 69.5822 },
  "Каратауский район": { latitude: 42.3528, longitude: 69.5747 },
  "район Тұран": { latitude: 42.3312, longitude: 69.6111 }
};
