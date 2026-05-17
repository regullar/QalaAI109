Ты — senior fullstack developer. Реализуй полноценный WebDev MVP для хакатона: “Qala AI”.

ВАЖНО:
- Не задавай уточняющих вопросов.
- Делай разумные дефолты.
- Не делай лишнюю архитектуру.
- Главная цель — рабочий, красивый, демонстрируемый MVP.
- Проект должен выглядеть как реальная Smart City веб-платформа.
- Карта ОБЯЗАТЕЛЬНО через 2GIS API / 2GIS MapGL, НЕ через Leaflet.
- Если 2GIS API key отсутствует, покажи понятный fallback UI с сообщением, но код карты всё равно должен быть написан под 2GIS MapGL.
- Не используй mock вместо всей системы, но demo-data разрешены.
- Не делай реальную интеграцию с I-Shymkent 109, WhatsApp, Telegram, eGov. Только demo/source labels.
- В интерфейсе обязательно укажи: “Demo Smart City MVP. Не является официальным сервисом акимата или I-Shymkent 109.”

====================================================
1. КОНЦЕПЦИЯ ПРОЕКТА
====================================================

Название:
Qala AI

Подзаголовок:
AI-диспетчер городских обращений для Шымкента

Суть:
Житель пишет городскую проблему обычным языком. Система автоматически:
1. определяет категорию;
2. определяет район;
3. выставляет срочность;
4. находит риск-факторы;
5. предлагает ответственную службу;
6. генерирует официальный текст обращения;
7. показывает заявку на карте 2GIS;
8. объединяет похожие обращения в проблемные кластеры;
9. показывает аналитику для оператора/акимата.

Главная уникальность:
Обычные системы видят 100 отдельных жалоб. Наш сервис показывает 5 реальных проблемных зон города.

====================================================
2. СТЕК
====================================================

Используй:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- 2GIS MapGL JS API
- OpenAI-compatible AI API or safe abstraction
- Recharts OR custom CSS charts
- No complex auth
- No Docker
- No Redis
- No heavy backend framework

NPM packages:
- @supabase/supabase-js
- @2gis/mapgl
- clsx
- lucide-react
- recharts if useful

Environment variables:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_2GIS_API_KEY=

If OPENAI_API_KEY is missing, use fallback classifier.
If NEXT_PUBLIC_2GIS_API_KEY is missing, show fallback map placeholder with clear warning.

====================================================
3. СТРУКТУРА ПРОЕКТА
====================================================

Создай/приведи проект к такой структуре:

app/
  page.tsx
  report/page.tsx
  map/page.tsx
  admin/page.tsx
  admin/analytics/page.tsx
  complaint/[id]/page.tsx

  api/
    complaints/route.ts
    complaints/[id]/route.ts
    complaints/[id]/status/route.ts
    complaints/analyze/route.ts
    analytics/route.ts
    seed/route.ts

components/
  layout/
    Header.tsx
    Nav.tsx

  landing/
    Hero.tsx
    FeatureCards.tsx
    DemoStats.tsx

  report/
    ComplaintForm.tsx
    AiPreviewCard.tsx
    EmergencyWarning.tsx

  map/
    TwoGisComplaintMap.tsx
    MapFilters.tsx
    ClusterPanel.tsx

  admin/
    ComplaintTable.tsx
    ComplaintDetailsDrawer.tsx
    StatusSelect.tsx
    PriorityBadge.tsx
    CategoryBadge.tsx
    ClusterBadge.tsx

  analytics/
    StatsCards.tsx
    TopCategories.tsx
    TopDistricts.tsx
    HotClusters.tsx

lib/
  supabase.ts
  supabase-admin.ts
  ai.ts
  fallback-classifier.ts
  cluster.ts
  constants.ts
  demo-data.ts
  utils.ts

types/
  complaint.ts
  analytics.ts

====================================================
4. СТРАНИЦЫ
====================================================

/ — Landing page

Hero:
- Title: Qala AI
- Subtitle: AI-диспетчер городских обращений для Шымкента.
- Text: Опишите проблему обычным языком — система сама определит категорию, срочность, район и ответственную службу.
- Buttons:
  - Сообщить о проблеме → /report
  - Открыть карту → /map
  - Панель оператора → /admin

Feature cards:
- AI-классификация
- Умная приоритизация
- Карта проблем 2GIS
- Кластеры повторяющихся жалоб
- Операторская панель
- Аналитика по районам

Demo stats:
- 5 районов Шымкента
- 14 категорий проблем
- AI + fallback classifier
- Web / 109 Demo / WhatsApp Demo / Telegram Demo sources

/report — форма обращения

Поля:
- textarea: описание проблемы
- select: район
- input: адрес / ориентир
- source select: Web, 109 Demo, WhatsApp Demo, Telegram Demo, Mobile App Demo
- точка на карте через 2GIS MapGL, если возможно
- если map click сложен, можно сделать default coordinates + optional manual latitude/longitude inputs

Кнопки:
- “Проанализировать через AI”
- “Отправить обращение”

Flow:
1. пользователь вводит текст;
2. нажимает Analyze;
3. frontend вызывает POST /api/complaints/analyze;
4. показывается AiPreviewCard;
5. пользователь отправляет;
6. создаётся запись через POST /api/complaints;
7. redirect на /complaint/[id] или /admin.

AI preview должен показывать:
- title
- category
- subcategory
- district
- priority
- riskFactors
- responsibleService
- appealText
- confidence
- emergency warning if needed

/map — карта 2GIS

Используй @2gis/mapgl.
Компонент должен быть client component.

Center:
Шымкент, примерный центр:
lng: 69.5901
lat: 42.3417
zoom: 12

Важно:
2GIS MapGL coordinates обычно в формате [longitude, latitude].
Не перепутай lat/lng.

Функции:
- показать заявки маркерами;
- цвет маркера по priority;
- popup/card при клике;
- фильтры: district/category/status/priority;
- toggle: show clusters;
- справа ClusterPanel с hot zones.

Priority colors:
- critical: red
- high: orange
- medium: yellow
- low: gray
- resolved: green

Если 2GIS key отсутствует:
- Не падай.
- Покажи блок: “2GIS API key не указан. Карта отключена, но данные заявок доступны.”
- Ни в коем случае не заменяй 2GIS на Leaflet.

/admin — операторская панель

Верхние карточки:
- Всего обращений
- Новые
- Критичные
- В работе
- Кластеры
- Решённые

Таблица:
columns:
- public_id
- title
- district
- category
- priority
- status
- cluster count
- created_at
- action

Фильтры:
- district
- category
- status
- priority
- only hot clusters

При клике на заявку открывай drawer:
- raw_text
- AI summary
- category
- subcategory
- priority
- district
- address
- riskFactors
- responsibleService
- appealText
- similar complaints
- status timeline
- buttons to change status

Статусы:
- new — Новая
- checking — Проверяется
- assigned — Передана в службу
- in_progress — В работе
- resolved — Решена
- rejected — Отклонена

/admin/analytics — аналитика

Покажи:
- total complaints
- critical count
- clusters count
- resolved percentage
- most frequent category
- most active district

Блоки:
- TopCategories
- TopDistricts
- HotClusters
- Priority distribution
- Status distribution

Hot cluster example:
мкр Нурсат — Уличное освещение — 12 обращений — high

/complaint/[id] — страница заявки

Покажи:
- public_id
- status
- priority
- title
- raw_text
- summary
- category
- district
- address
- responsibleService
- appealText
- riskFactors
- mini map or map link
- status timeline

====================================================
5. ДАННЫЕ И ТИПЫ
====================================================

Создай types/complaint.ts:

export type ComplaintPriority = "low" | "medium" | "high" | "critical";

export type ComplaintStatus =
  | "new"
  | "checking"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected";

export type Complaint = {
  id: string;
  public_id: string;

  raw_text: string;
  title: string;
  summary: string | null;

  category: string;
  subcategory: string | null;
  priority: ComplaintPriority;
  status: ComplaintStatus;

  district: string | null;
  address_text: string | null;
  latitude: number | null;
  longitude: number | null;

  responsible_service: string | null;
  appeal_text: string | null;
  risk_factors: string[] | null;
  ai_confidence: number | null;

  source: string;
  is_demo: boolean;
  needs_emergency_warning: boolean;

  created_at: string;
  updated_at: string;
};

====================================================
6. SUPABASE SQL
====================================================

Создай SQL migration или файл supabase-schema.sql:

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),

  public_id text unique not null,

  raw_text text not null,
  title text not null,
  summary text,

  category text not null,
  subcategory text,
  priority text not null,
  status text not null default 'new',

  district text,
  address_text text,
  latitude double precision,
  longitude double precision,

  responsible_service text,
  appeal_text text,
  risk_factors text[],
  ai_confidence double precision,

  source text default 'web',
  is_demo boolean default true,
  needs_emergency_warning boolean default false,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists status_logs (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id) on delete cascade,
  old_status text,
  new_status text not null,
  comment text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_complaints_category on complaints(category);
create index if not exists idx_complaints_district on complaints(district);
create index if not exists idx_complaints_priority on complaints(priority);
create index if not exists idx_complaints_status on complaints(status);
create index if not exists idx_complaints_created_at on complaints(created_at);

====================================================
7. КОНСТАНТЫ
====================================================

lib/constants.ts:

export const DISTRICTS = [
  "Абайский район",
  "Аль-Фарабийский район",
  "Енбекшинский район",
  "Каратауский район",
  "район Тұран",
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
  "Другое",
] as const;

export const SOURCES = [
  "Web",
  "109 Demo",
  "WhatsApp Demo",
  "Telegram Demo",
  "Mobile App Demo",
] as const;

export const SHYMKENT_CENTER = {
  lat: 42.3417,
  lng: 69.5901,
};

====================================================
8. AI ANALYZE ENDPOINT
====================================================

POST /api/complaints/analyze

Request:
{
  "text": "...",
  "district": "...",
  "addressText": "..."
}

Response:
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

Prompt для AI:

Ты AI-диспетчер городских обращений Шымкента.

Твоя задача — разобрать обращение жителя и вернуть строго JSON без markdown.

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
- Если район не указан, верни "Не определён".
- Если есть угроза жизни, газ, пожар, ДТП, открытый люк, оголённый провод — priority = critical.
- Если рядом школа, дети, пешеходный переход, светофор, темная улица — priority минимум high.
- Если обращение эмоциональное, перепиши его в официальный деловой текст.
- Если текст не относится к городской проблеме, category = "Другое", priority = "low".
- Ответ только JSON.

Если OPENAI_API_KEY отсутствует или AI падает:
- Используй fallbackClassify().
- Верни валидный объект того же формата.
- Не ломай UI.

====================================================
9. FALLBACK CLASSIFIER
====================================================

lib/fallback-classifier.ts

Реализуй функцию fallbackClassify(text, district?, addressText?) со следующей логикой:

- critical words:
  газ, пожар, дтп, люк, провод, искрит, угроза, обрыв
  => category Безопасность, priority critical, needsEmergencyWarning true

- traffic high:
  светофор, переход, пешеход
  => category Светофоры и переходы, priority high

- lighting:
  фонарь, освещ, темно, не горит
  => category Уличное освещение, priority high если есть дети/школа, иначе medium

- electricity:
  свет, электр, отключили, нет света
  => category Электроснабжение, priority high

- water:
  вода, водоснаб, нет воды
  => category Водоснабжение, priority high/medium

- road:
  яма, асфальт, дорога, тротуар
  => category Дороги и тротуары, priority medium

- transport:
  автобус, маршрут, остановка
  => category Общественный транспорт, priority medium

- trash:
  мусор, уборка, контейнер
  => category Мусор и санитария, priority medium

- otherwise:
  category Другое, priority low

====================================================
10. CLUSTERS
====================================================

lib/cluster.ts

Главная фича проекта — кластеры повторяющихся жалоб.

Реализуй:
- normalizeAddress(address)
- getClusterKey(complaint)
- groupComplaintsIntoClusters(complaints)

Простое правило:
clusterKey = district + category + normalizedAddress

Если address пустой:
clusterKey = district + category

normalizedAddress:
- lowercase
- remove "мкр", "микрорайон", punctuation
- trim spaces

Cluster object:
{
  key: string;
  district: string;
  category: string;
  addressText: string;
  count: number;
  priority: ComplaintPriority;
  complaints: Complaint[];
  latestCreatedAt: string;
}

Priority кластера:
critical если есть critical
high если есть high
medium если есть medium
low otherwise

Hot cluster:
count >= 3

В UI показывать:
- "Горячая зона"
- count
- category
- district
- priority
- latestCreatedAt

====================================================
11. 2GIS MAP IMPLEMENTATION
====================================================

Создай components/map/TwoGisComplaintMap.tsx.

Требования:
- "use client";
- dynamic behavior without SSR crash;
- import @2gis/mapgl safely only on client or use dynamic import;
- create map instance inside useEffect;
- destroy map on unmount;
- markers for complaints;
- marker click selects complaint and shows side card/popup;
- marker colors by priority;
- cluster mode: show larger circle-like HTML markers with count;
- map center Shymkent;
- no Leaflet.

Pseudo behavior:
const map = new mapgl.Map(containerRef.current, {
  center: [SHYMKENT_CENTER.lng, SHYMKENT_CENTER.lat],
  zoom: 12,
  key: process.env.NEXT_PUBLIC_2GIS_API_KEY
});

For marker:
new mapgl.Marker(map, {
  coordinates: [complaint.longitude, complaint.latitude],
});

If HTML markers are supported by installed package, use custom HTML for colored marker. If not, use default markers and show colored cards in side panel.

Do not break if coordinates are null:
- generate demo coordinates around Shymkent center based on index;
- or skip marker and list in side panel.

====================================================
12. API ROUTES
====================================================

POST /api/complaints
- validate body
- analyze text using AI/fallback
- generate public_id like SH-109-0001 or SH-109-{timestamp short}
- insert into Supabase
- insert status log: new
- return complaint

GET /api/complaints
- support filters:
  district
  category
  priority
  status
- order by created_at desc

GET /api/complaints/[id]
- find by id OR public_id

PATCH /api/complaints/[id]/status
- update status
- insert status_logs row
- return updated complaint

GET /api/analytics
- fetch all complaints
- compute:
  total
  newCount
  criticalCount
  resolvedCount
  clustersCount
  topCategories
  topDistricts
  priorityDistribution
  statusDistribution
  hotClusters

POST /api/seed
- insert demo data if table is empty
- protected by simple query param or env in dev only
- useful for hackathon setup

====================================================
13. DEMO DATA
====================================================

Создай lib/demo-data.ts с 35–40 заявками.

Распределение:
- Электроснабжение — 10
- Уличное освещение — 8
- Дороги и тротуары — 6
- Мусор и санитария — 5
- Общественный транспорт — 4
- Светофоры и переходы — 3
- Водоснабжение — 2
- Безопасность — 2

Микрорайоны/ориентиры:
- Нурсат
- Самал
- Кайтпас
- Асар
- Тұран
- Шымсити
- Каратау
- Бозарык
- Жанаталап
- Казыгурт
- Север
- Центр

Сделай несколько повторяющихся жалоб, чтобы появились кластеры:
- Нурсат + Уличное освещение >= 5
- Самал + Электроснабжение >= 5
- Кайтпас + Дороги и тротуары >= 4
- Тұран + Мусор и санитария >= 3

Важно:
- Все demo-data должны быть помечены is_demo = true.
- Не утверждать, что это реальные обращения.
- В UI показывать “Демо-данные для презентации”.

====================================================
14. UI/UX
====================================================

Стиль:
- modern civic SaaS/dashboard
- light background
- white cards
- rounded-2xl
- soft shadows
- clean typography
- no childish colors
- responsive

Header:
- logo/name
- nav links:
  Главная
  Подать обращение
  Карта
  Оператор
  Аналитика
- demo badge

Badges:
PriorityBadge:
- critical red
- high orange
- medium yellow
- low gray

StatusBadge:
- new gray
- checking yellow
- assigned blue
- in_progress orange
- resolved green
- rejected red

RU/KZ labels somewhere:
- Сообщить о проблеме / Мәселе туралы хабарлау
- Карта обращений / Өтініштер картасы
- Район / Аудан
- Статус / Мәртебе
- Приоритет / Басымдық

Emergency warning:
If needsEmergencyWarning:
“Внимание: если есть непосредственная угроза жизни или здоровью, звоните 112.”

AI confidence:
Show:
“Уверенность AI: 87%”
If < 60:
“Требуется проверка оператором”

====================================================
15. PRESENTATION-READY DETAILS
====================================================

В интерфейсе должны быть готовые фразы для защиты:

Landing section:
“Мы не заменяем I-Shymkent 109 — мы показываем AI-слой, который помогает быстрее классифицировать и приоритизировать обращения.”

Analytics section:
“Система показывает не просто список жалоб, а повторяющиеся проблемные зоны города.”

Map page:
“Карта построена на 2GIS API.”

Admin page:
“Оператор видит не сырой текст, а AI-резюме, риск-факторы и рекомендуемую службу.”

====================================================
16. QUALITY REQUIREMENTS
====================================================

- TypeScript без any, кроме крайних случаев.
- Аккуратная обработка ошибок.
- Loading states.
- Empty states.
- No app crash if env vars missing.
- No broken imports.
- No SSR crash with 2GIS.
- Build should pass.
- Run npm run lint if available.
- Use clean component structure.
- Keep code simple and hackathon-friendly.

====================================================
17. ACCEPTANCE CRITERIA
====================================================

После реализации должно работать:

1. / открывается и понятно объясняет проект.
2. /report позволяет ввести обращение.
3. Analyze вызывает AI или fallback и показывает preview.
4. Submit создаёт заявку в Supabase.
5. /map показывает карту 2GIS и markers/cluster mode.
6. /admin показывает таблицу заявок.
7. Можно менять статус заявки.
8. /admin/analytics показывает статистику и hot clusters.
9. Demo data можно засеять.
10. Без AI key приложение не ломается.
11. Без 2GIS key приложение не ломается, но честно показывает предупреждение.
12. Везде есть disclaimer, что это demo MVP, не официальный сервис.
13. Проект можно показать жюри за 3 минуты.

Начни с проверки существующего проекта. Если проекта нет — создай Next.js TypeScript проект. Затем реализуй всё по шагам. После каждого крупного этапа проверяй, что приложение билдится.

====================================================
18. DEPLOYMENT REQUIREMENTS
====================================================

Проект должен деплоиться на Vercel максимально просто.

Требования:
- No Docker
- No custom server
- No nginx
- No pm2
- No Redis
- No local-only dependencies
- No filesystem persistence
- No node-specific hacks incompatible with Vercel
- No edge-runtime complexity unless needed
- Prefer standard Next.js route handlers

Проект должен запускаться:
1. npm install
2. npm run build
3. deploy to Vercel

Все API routes должны работать через стандартные Next.js route handlers.

====================================================
19. VERCEL COMPATIBILITY
====================================================

Убедись:
- нет SSR crash из-за 2GIS
- карта только client-side
- dynamic import for @2gis/mapgl if needed
- environment variables читаются через process.env
- no window usage on server
- no document usage on server

====================================================
20. ENVIRONMENT VARIABLES
====================================================

Создай:
- .env.example
- README.md

README должен содержать:
1. setup instructions
2. Supabase setup
3. Vercel deploy
4. 2GIS API setup
5. OpenAI API setup
6. seed demo data instructions

====================================================
21. BUILD SAFETY
====================================================

Перед завершением:
- проверь npm run build
- проверь TypeScript
- проверь что pages рендерятся
- проверь что map component не ломает SSR
- проверь что отсутствие API keys не ломает приложение

====================================================
22. VERCEL DEPLOY FLOW
====================================================

README должен содержать:
1. Push to GitHub
2. Import project in Vercel
3. Add env variables
4. Deploy

====================================================
23. REQUIRED ENV VARS FOR VERCEL
====================================================

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
OPENAI_MODEL
NEXT_PUBLIC_2GIS_API_KEY
