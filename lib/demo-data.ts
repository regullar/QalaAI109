import { CATEGORIES, DISTRICTS, SOURCES } from "@/lib/constants";
import type { ComplaintPriority, ComplaintStatus } from "@/types/complaint";

export type DemoComplaintSeed = {
  raw_text: string;
  title: string;
  summary: string;
  category: string;
  subcategory: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  district: string;
  address_text: string;
  latitude: number;
  longitude: number;
  responsible_service: string;
  appeal_text: string;
  risk_factors: string[];
  ai_confidence: number;
  source: string;
  is_demo: boolean;
  needs_emergency_warning: boolean;
};

type DemoInput = Omit<DemoComplaintSeed, "source" | "is_demo" | "category" | "district"> & {
  category: string;
  district: string;
};

const statuses: ComplaintStatus[] = ["new", "checking", "assigned", "in_progress", "resolved"];

function sourceByIndex(index: number) {
  return SOURCES[index % SOURCES.length];
}

function assertCategory(category: string) {
  return CATEGORIES.includes(category as (typeof CATEGORIES)[number]) ? category : "Другое";
}

function assertDistrict(district: string) {
  return DISTRICTS.includes(district as (typeof DISTRICTS)[number]) ? district : DISTRICTS[0];
}

function buildComplaint(index: number, input: DemoInput): DemoComplaintSeed {
  return {
    ...input,
    category: assertCategory(input.category),
    district: assertDistrict(input.district),
    source: sourceByIndex(index),
    is_demo: true
  };
}

function streetLight(index: number, address: string, lat: number, lng: number, priority: ComplaintPriority = "high") {
  return buildComplaint(index, {
    raw_text: `В ${address} вечером не горят фонари, пешеходам темно идти домой.`,
    title: "Не работает уличное освещение",
    summary: "Жители сообщают об отсутствии уличного освещения на пешеходном участке.",
    category: "Уличное освещение",
    subcategory: "Не работают фонари",
    priority,
    status: statuses[index % statuses.length],
    district: index < 6 ? "Аль-Фарабийский район" : "район Тұран",
    address_text: address,
    latitude: lat,
    longitude: lng,
    responsible_service: "Районный акимат / служба уличного освещения",
    appeal_text: `Прошу проверить и восстановить уличное освещение по адресу: ${address}.`,
    risk_factors: priority === "high" ? ["темное место", "риск для пешеходов"] : [],
    ai_confidence: 0.82,
    needs_emergency_warning: false
  });
}

function electricity(index: number, address: string, lat: number, lng: number, status: ComplaintStatus) {
  return buildComplaint(index, {
    raw_text: `В ${address} перебои с электричеством, свет отключается несколько раз в день.`,
    title: "Перебои с электроснабжением",
    summary: "Сообщается о повторяющихся отключениях или нестабильном напряжении.",
    category: "Электроснабжение",
    subcategory: "Отключение или нестабильное напряжение",
    priority: "high",
    status,
    district: index < 12 ? "Абайский район" : "Енбекшинский район",
    address_text: address,
    latitude: lat,
    longitude: lng,
    responsible_service: "Энергоснабжающая организация",
    appeal_text: `Прошу проверить линию электроснабжения и устранить перебои по адресу: ${address}.`,
    risk_factors: ["перебой коммунальной услуги"],
    ai_confidence: 0.84,
    needs_emergency_warning: false
  });
}

function road(index: number, address: string, lat: number, lng: number, priority: ComplaintPriority = "medium") {
  return buildComplaint(index, {
    raw_text: `На участке ${address} поврежден асфальт, водители объезжают яму по встречной полосе.`,
    title: "Повреждение дороги",
    summary: "На дороге или тротуаре зафиксировано повреждение покрытия.",
    category: "Дороги и тротуары",
    subcategory: "Яма / повреждение покрытия",
    priority,
    status: statuses[index % statuses.length],
    district: "Каратауский район",
    address_text: address,
    latitude: lat,
    longitude: lng,
    responsible_service: "Служба ремонта дорог",
    appeal_text: `Прошу провести ремонт дорожного покрытия по адресу: ${address}.`,
    risk_factors: priority === "high" ? ["риск ДТП"] : [],
    ai_confidence: 0.78,
    needs_emergency_warning: false
  });
}

function trash(index: number, address: string, lat: number, lng: number, priority: ComplaintPriority = "medium") {
  return buildComplaint(index, {
    raw_text: `В ${address} переполнены мусорные контейнеры, отходы лежат рядом с площадкой.`,
    title: "Переполнены мусорные контейнеры",
    summary: "Нужно вывезти отходы и привести контейнерную площадку в порядок.",
    category: "Мусор и санитария",
    subcategory: "Переполнение контейнеров",
    priority,
    status: statuses[index % statuses.length],
    district: "район Тұран",
    address_text: address,
    latitude: lat,
    longitude: lng,
    responsible_service: "Санитарная служба / подрядчик по вывозу мусора",
    appeal_text: `Прошу организовать вывоз мусора и уборку контейнерной площадки: ${address}.`,
    risk_factors: priority === "high" ? ["детская площадка рядом", "санитарный риск"] : [],
    ai_confidence: 0.76,
    needs_emergency_warning: false
  });
}

function transport(index: number, address: string, route: string, lat: number, lng: number) {
  return buildComplaint(index, {
    raw_text: `Автобус ${route} на остановке ${address} часто опаздывает или проезжает без остановки.`,
    title: "Нарушение графика автобуса",
    summary: "Пассажиры жалуются на нерегулярный интервал общественного транспорта.",
    category: "Общественный транспорт",
    subcategory: "График маршрута",
    priority: "medium",
    status: statuses[index % statuses.length],
    district: index % 2 === 0 ? "Каратауский район" : "район Тұран",
    address_text: address,
    latitude: lat,
    longitude: lng,
    responsible_service: "Управление пассажирского транспорта",
    appeal_text: `Прошу проверить соблюдение графика маршрута ${route} на остановке ${address}.`,
    risk_factors: [],
    ai_confidence: 0.73,
    needs_emergency_warning: false
  });
}

const seed: DemoComplaintSeed[] = [
  streetLight(0, "мкр Нурсат, школа N12", 42.3438, 69.5886),
  streetLight(1, "мкр Нурсат, квартал 23", 42.3441, 69.5892),
  streetLight(2, "мкр Нурсат, спортивная площадка", 42.3435, 69.5908, "medium"),
  streetLight(3, "мкр Нурсат, двор 8А", 42.3429, 69.5898, "medium"),
  streetLight(4, "мкр Нурсат, возле аптеки", 42.3444, 69.5914),
  streetLight(5, "мкр Нурсат, дом 17", 42.3432, 69.5889, "medium"),
  electricity(6, "мкр Самал, сектор Б", 42.3369, 69.6011, "new"),
  electricity(7, "мкр Самал, многоэтажные дома", 42.3372, 69.6004, "checking"),
  electricity(8, "мкр Самал, возле рынка", 42.3365, 69.6022, "assigned"),
  electricity(9, "мкр Самал-3", 42.3378, 69.6017, "in_progress"),
  electricity(10, "мкр Самал, квартал 9", 42.3381, 69.6009, "new"),
  electricity(11, "мкр Самал, жилой комплекс", 42.3375, 69.6028, "resolved"),
  road(12, "Кайтпас, центральная остановка", 42.3542, 69.5778),
  road(13, "Кайтпас, переулок 4", 42.3536, 69.5785),
  road(14, "Кайтпас, вход в поликлинику", 42.3547, 69.5769),
  road(15, "Кайтпас-2", 42.3539, 69.5792, "high"),
  road(16, "Кайтпас, школьная зона", 42.3545, 69.5789),
  trash(17, "район Тұран, квартал 5", 42.3308, 69.6104),
  trash(18, "район Тұран, дом 11", 42.3312, 69.6111),
  trash(19, "район Тұран, детская площадка", 42.3305, 69.6098, "high"),
  trash(20, "район Тұран, переулок C", 42.3318, 69.6107),
  electricity(21, "Бозарык, частный сектор", 42.3219, 69.5661, "new"),
  electricity(22, "Асар, жилой массив", 42.3485, 69.5705, "checking"),
  electricity(23, "Центр, проспект Республики", 42.3392, 69.5968, "assigned"),
  electricity(24, "Каратау, рынок", 42.3528, 69.5747, "resolved"),
  streetLight(25, "Шымсити, пешеходный переход", 42.3341, 69.6148, "medium"),
  streetLight(26, "проспект Казыгурт, остановка", 42.3278, 69.5835, "medium"),
  road(27, "Северный путепровод", 42.3459, 69.6071),
  trash(28, "Центр, пешеходная аллея", 42.3406, 69.5949),
  transport(29, "Асар", "52", 42.3479, 69.5712),
  transport(30, "Тұран, главная остановка", "19", 42.3324, 69.6126),
  transport(31, "Жанаталап, остановка у дороги", "7", 42.3196, 69.5763),
  transport(32, "Центральный вокзал", "27", 42.3401, 69.5961),
  buildComplaint(33, {
    raw_text: "На перекрестке в Самале не работает светофор, машины едут без регулирования.",
    title: "Не работает светофор",
    summary: "Светофор на оживленном переходе требует срочной проверки.",
    category: "Светофоры и переходы",
    subcategory: "Не работает светофор",
    priority: "high",
    status: "new",
    district: "Абайский район",
    address_text: "мкр Самал, главный перекресток",
    latitude: 42.3383,
    longitude: 69.6034,
    responsible_service: "Служба организации дорожного движения",
    appeal_text: "Прошу восстановить работу светофора на главном перекрестке мкр Самал.",
    risk_factors: ["риск ДТП", "пешеходный переход"],
    ai_confidence: 0.86,
    needs_emergency_warning: false
  }),
  buildComplaint(34, {
    raw_text: "Возле школы в Нурсате слишком короткий сигнал для пешеходов, дети не успевают перейти.",
    title: "Короткий сигнал пешеходного перехода",
    summary: "Пешеходная фаза светофора недостаточна возле школы.",
    category: "Светофоры и переходы",
    subcategory: "Настройка светофора",
    priority: "high",
    status: "checking",
    district: "Аль-Фарабийский район",
    address_text: "мкр Нурсат, школьный переход",
    latitude: 42.3442,
    longitude: 69.5902,
    responsible_service: "Служба организации дорожного движения",
    appeal_text: "Прошу увеличить длительность зеленого сигнала для пешеходов возле школы в Нурсате.",
    risk_factors: ["дети", "школа", "пешеходный переход"],
    ai_confidence: 0.85,
    needs_emergency_warning: false
  }),
  buildComplaint(35, {
    raw_text: "На проспекте Тұран почти стерлась разметка пешеходного перехода.",
    title: "Стерлась разметка перехода",
    summary: "Пешеходный переход плохо виден водителям.",
    category: "Светофоры и переходы",
    subcategory: "Разметка перехода",
    priority: "medium",
    status: "assigned",
    district: "район Тұран",
    address_text: "проспект Тұран, перекресток",
    latitude: 42.3331,
    longitude: 69.6118,
    responsible_service: "Служба организации дорожного движения",
    appeal_text: "Прошу обновить разметку пешеходного перехода на проспекте Тұран.",
    risk_factors: [],
    ai_confidence: 0.72,
    needs_emergency_warning: false
  }),
  buildComplaint(36, {
    raw_text: "В Енбекшинском районе с обеда нет воды в многоэтажном доме.",
    title: "Нет водоснабжения",
    summary: "Жители сообщают об отключении воды в жилом доме.",
    category: "Водоснабжение",
    subcategory: "Отключение воды",
    priority: "high",
    status: "new",
    district: "Енбекшинский район",
    address_text: "Енбекшинский район, дом 14",
    latitude: 42.3254,
    longitude: 69.5822,
    responsible_service: "Водоканал",
    appeal_text: "Прошу восстановить водоснабжение в доме 14 Енбекшинского района.",
    risk_factors: ["перебой коммунальной услуги"],
    ai_confidence: 0.82,
    needs_emergency_warning: false
  }),
  buildComplaint(37, {
    raw_text: "В частных домах Каратау ночью очень слабый напор воды.",
    title: "Слабый напор воды",
    summary: "Давление воды падает в ночное время.",
    category: "Водоснабжение",
    subcategory: "Низкое давление",
    priority: "medium",
    status: "in_progress",
    district: "Каратауский район",
    address_text: "Каратау, частный сектор",
    latitude: 42.3516,
    longitude: 69.5759,
    responsible_service: "Водоканал",
    appeal_text: "Прошу проверить и стабилизировать давление воды в частном секторе Каратау.",
    risk_factors: [],
    ai_confidence: 0.75,
    needs_emergency_warning: false
  }),
  buildComplaint(38, {
    raw_text: "Открытый люк возле остановки в центре, люди могут упасть.",
    title: "Открытый люк возле остановки",
    summary: "Открытый люк создает непосредственную опасность для пешеходов.",
    category: "Безопасность",
    subcategory: "Открытый люк",
    priority: "critical",
    status: "new",
    district: "Аль-Фарабийский район",
    address_text: "Центр, остановка у аллеи",
    latitude: 42.3399,
    longitude: 69.5956,
    responsible_service: "Экстренная и коммунальная служба",
    appeal_text: "Прошу срочно оградить и закрыть открытый люк возле остановки в центре.",
    risk_factors: ["угроза травмы", "пешеходы рядом"],
    ai_confidence: 0.9,
    needs_emergency_warning: true
  }),
  buildComplaint(39, {
    raw_text: "Оголенный электрический провод рядом с детской площадкой в Тұране.",
    title: "Оголенный провод возле площадки",
    summary: "Оголенный провод рядом с детской площадкой требует срочного реагирования.",
    category: "Безопасность",
    subcategory: "Оголенный провод",
    priority: "critical",
    status: "assigned",
    district: "район Тұран",
    address_text: "район Тұран, блок 2, детская площадка",
    latitude: 42.3314,
    longitude: 69.6131,
    responsible_service: "Экстренная и коммунальная служба",
    appeal_text: "Прошу срочно изолировать и отремонтировать оголенный провод возле детской площадки.",
    risk_factors: ["риск поражения током", "дети рядом"],
    ai_confidence: 0.92,
    needs_emergency_warning: true
  })
];

function duplicateComplaint(
  sourceIndex: number,
  nextIndex: number,
  overrides: Partial<Pick<DemoComplaintSeed, "raw_text" | "title" | "summary" | "priority" | "status" | "risk_factors">>
) {
  const source = seed[sourceIndex];
  return buildComplaint(nextIndex, {
    ...source,
    ...overrides
  });
}

const clusterDuplicates: DemoComplaintSeed[] = [
  duplicateComplaint(0, 40, {
    raw_text: "Повторная жалоба: возле школы N12 в Нурсате вечером снова не горят фонари.",
    status: "new",
    priority: "critical",
    risk_factors: ["школа рядом", "темный переход", "риск для детей"]
  }),
  duplicateComplaint(0, 41, {
    raw_text: "Жители снова сообщают, что у школы N12 темно и дети идут домой без освещения.",
    status: "checking",
    priority: "high"
  }),
  duplicateComplaint(0, 42, {
    raw_text: "Третье обращение по освещению у школы N12, проблема сохраняется несколько дней.",
    status: "assigned",
    priority: "high"
  }),
  duplicateComplaint(6, 43, {
    raw_text: "Повторная жалоба по Самалу: свет в секторе Б отключается несколько раз за вечер.",
    status: "new",
    priority: "high"
  }),
  duplicateComplaint(6, 44, {
    raw_text: "Жители сектора Б снова жалуются на нестабильное электричество.",
    status: "in_progress",
    priority: "medium"
  }),
  duplicateComplaint(12, 45, {
    raw_text: "На центральной остановке Кайтпас яма стала больше, машины резко объезжают ее.",
    status: "new",
    priority: "high",
    risk_factors: ["риск ДТП", "остановка рядом"]
  }),
  duplicateComplaint(12, 46, {
    raw_text: "Повторное обращение по дороге у центральной остановки Кайтпас.",
    status: "checking",
    priority: "medium"
  }),
  duplicateComplaint(17, 47, {
    raw_text: "В квартале 5 района Туран контейнеры снова переполнены, мусор лежит на земле.",
    status: "new",
    priority: "high",
    risk_factors: ["санитарный риск"]
  }),
  duplicateComplaint(17, 48, {
    raw_text: "Повторная жалоба по мусору в квартале 5, запах усиливается.",
    status: "assigned",
    priority: "medium"
  }),
  duplicateComplaint(38, 49, {
    raw_text: "Открытый люк у остановки в центре все еще не закрыт, люди обходят его по дороге.",
    status: "new",
    priority: "critical"
  }),
  duplicateComplaint(38, 50, {
    raw_text: "Повторное срочное обращение: открытый люк у аллеи остается опасным.",
    status: "checking",
    priority: "critical"
  })
];

export const DEMO_COMPLAINTS: DemoComplaintSeed[] = [...seed, ...clusterDuplicates];
