# STYLE.md — Qala AI

## 1. Design direction

**Project:** Qala AI
**Style:** modern civic SaaS dashboard / Smart City web platform  
**Goal:** clean, official, trustworthy, readable, demo-ready.

The interface must look like a real city-service web dashboard, not like a school presentation or gaming UI.

### Visual principles

- Use a light theme.
- Use soft gray-blue page background.
- Use white cards with subtle borders and shadows.
- Use blue as the main action color.
- Use cyan as the AI / Smart City accent.
- Use red, orange, yellow, green only for status and priority.
- Do not invent random colors.
- Do not overuse gradients.
- Do not use harsh shadows.
- Do not make the UI too colorful.

---

## 2. Core palette

| Token | HEX | Usage |
|---|---:|---|
| `app.bg` | `#F6F8FB` | Main page background |
| `app.surface` | `#FFFFFF` | Cards, panels, tables, drawer |
| `app.surfaceMuted` | `#EEF3F8` | Secondary blocks |
| `app.text` | `#102033` | Main text |
| `app.textMuted` | `#5B6B7C` | Secondary text |
| `app.placeholder` | `#94A3B8` | Placeholders, timestamps |
| `app.border` | `#D9E2EC` | Borders, dividers |
| `app.borderStrong` | `#CBD5E1` | Strong borders |

---

## 3. Primary colors

| Token | HEX | Usage |
|---|---:|---|
| `primary.DEFAULT` | `#2563EB` | Main buttons, active links |
| `primary.hover` | `#1D4ED8` | Hover state |
| `primary.active` | `#1E40AF` | Pressed state |
| `primary.soft` | `#DBEAFE` | Active nav bg, soft selected bg |
| `primary.ring` | `#93C5FD` | Focus ring |

Use primary blue for:

- main CTA;
- submit buttons;
- selected nav item;
- active filters;
- assigned status;
- important links.

---

## 4. Accent / AI colors

| Token | HEX | Usage |
|---|---:|---|
| `accent.DEFAULT` | `#06B6D4` | AI / Smart City accent |
| `accent.hover` | `#0891B2` | Hover accent |
| `accent.active` | `#0E7490` | Active accent |
| `accent.soft` | `#CFFAFE` | AI soft backgrounds |
| `accent.ring` | `#67E8F9` | AI focus ring |

### AI gradient

```css
background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
```

Use AI gradient only for:

- “Проанализировать через AI” button;
- AI badge;
- AI preview highlight;
- hero accent.

Do not use gradients for every card.

---

## 5. Priority colors

Use priority colors for complaint urgency, map markers, badges, and cluster logic.

| Priority | Default | Soft BG | Text | Border |
|---|---:|---:|---:|---:|
| `critical` | `#DC2626` | `#FEE2E2` | `#991B1B` | `#FCA5A5` |
| `high` | `#F97316` | `#FFEDD5` | `#9A3412` | `#FDBA74` |
| `medium` | `#EAB308` | `#FEF3C7` | `#92400E` | `#FCD34D` |
| `low` | `#64748B` | `#F1F5F9` | `#475569` | `#CBD5E1` |
| `resolved` | `#16A34A` | `#DCFCE7` | `#166534` | `#86EFAC` |

### Priority meaning

| Priority | Meaning |
|---|---|
| `critical` | threat to life, gas, fire, open manhole, exposed wire, ДТП |
| `high` | children, school, dark street, traffic light, pedestrian crossing |
| `medium` | road issue, trash, broken stop, normal infrastructure issue |
| `low` | suggestion, unclear minor issue |
| `resolved` | solved complaint |

### Map marker colors

| Marker | HEX |
|---|---:|
| `critical` | `#DC2626` |
| `high` | `#F97316` |
| `medium` | `#EAB308` |
| `low` | `#64748B` |
| `resolved` | `#16A34A` |

---

## 6. Status colors

Use status colors for workflow states in the operator dashboard.

| Status | BG | Text | Border | Dot |
|---|---:|---:|---:|---:|
| `new` | `#F1F5F9` | `#475569` | `#CBD5E1` | `#64748B` |
| `checking` | `#FEF3C7` | `#92400E` | `#FCD34D` | `#D97706` |
| `assigned` | `#DBEAFE` | `#1D4ED8` | `#93C5FD` | `#2563EB` |
| `in_progress` | `#FFEDD5` | `#9A3412` | `#FDBA74` | `#EA580C` |
| `resolved` | `#DCFCE7` | `#166534` | `#86EFAC` | `#16A34A` |
| `rejected` | `#FEE2E2` | `#991B1B` | `#FCA5A5` | `#DC2626` |

### Status labels

```ts
const STATUS_LABELS = {
  new: "Новая",
  checking: "Проверяется",
  assigned: "Передана в службу",
  in_progress: "В работе",
  resolved: "Решена",
  rejected: "Отклонена",
};
```

---

## 7. Buttons

### Primary button

Use for:

- “Сообщить о проблеме”;
- “Отправить обращение”;
- “Открыть карту”;
- important confirm actions.

| State | Color |
|---|---:|
| BG | `#2563EB` |
| Text | `#FFFFFF` |
| Border | `#2563EB` |
| Hover BG | `#1D4ED8` |
| Active BG | `#1E40AF` |
| Focus Ring | `#93C5FD` |
| Disabled BG | `#CBD5E1` |
| Disabled Text | `#64748B` |

```css
.btn-primary {
  background: #2563EB;
  color: #FFFFFF;
  border: 1px solid #2563EB;
}

.btn-primary:hover {
  background: #1D4ED8;
  border-color: #1D4ED8;
}

.btn-primary:active {
  background: #1E40AF;
  border-color: #1E40AF;
}

.btn-primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px #93C5FD;
}
```

---

### AI button

Use for:

- “Проанализировать через AI”;
- “Сгенерировать текст обращения”;
- AI preview actions.

```css
.btn-ai {
  background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
  color: #FFFFFF;
  box-shadow: 0 12px 28px rgba(6, 182, 212, 0.22);
}

.btn-ai:hover {
  background: linear-gradient(135deg, #1D4ED8 0%, #0891B2 100%);
  box-shadow: 0 16px 34px rgba(6, 182, 212, 0.28);
}

.btn-ai:active {
  background: linear-gradient(135deg, #1E40AF 0%, #0E7490 100%);
}
```

---

### Secondary button

Use for:

- “Назад”;
- “Отмена”;
- “Сбросить фильтры”;
- secondary actions.

| State | Color |
|---|---:|
| BG | `#FFFFFF` |
| Text | `#102033` |
| Border | `#D9E2EC` |
| Hover BG | `#F1F5F9` |
| Active BG | `#E2E8F0` |

```css
.btn-secondary {
  background: #FFFFFF;
  color: #102033;
  border: 1px solid #D9E2EC;
}

.btn-secondary:hover {
  background: #F1F5F9;
}

.btn-secondary:active {
  background: #E2E8F0;
}
```

---

### Ghost button

Use for:

- header navigation;
- low-emphasis controls;
- icon buttons.

| State | Color |
|---|---:|
| BG | `transparent` |
| Text | `#5B6B7C` |
| Hover BG | `#EEF3F8` |
| Hover Text | `#102033` |
| Active BG | `#DBEAFE` |
| Active Text | `#1D4ED8` |

```css
.btn-ghost {
  background: transparent;
  color: #5B6B7C;
}

.btn-ghost:hover {
  background: #EEF3F8;
  color: #102033;
}

.btn-ghost-active {
  background: #DBEAFE;
  color: #1D4ED8;
}
```

---

### Danger button

Use for:

- reject complaint;
- delete demo data;
- destructive actions.

| State | Color |
|---|---:|
| BG | `#DC2626` |
| Text | `#FFFFFF` |
| Hover BG | `#B91C1C` |
| Active BG | `#991B1B` |
| Soft BG | `#FEE2E2` |
| Soft Text | `#991B1B` |

---

### Success button

Use for:

- mark as resolved;
- confirm;
- complete action.

| State | Color |
|---|---:|
| BG | `#16A34A` |
| Text | `#FFFFFF` |
| Hover BG | `#15803D` |
| Active BG | `#166534` |
| Soft BG | `#DCFCE7` |
| Soft Text | `#166534` |

---

### Warning button

Use for:

- take into work;
- transfer to service;
- high-priority operator actions.

| State | Color |
|---|---:|
| BG | `#F97316` |
| Text | `#FFFFFF` |
| Hover BG | `#EA580C` |
| Active BG | `#C2410C` |
| Soft BG | `#FFEDD5` |
| Soft Text | `#9A3412` |

---

## 8. Active states

### Active navigation item

```css
.nav-active {
  background: #DBEAFE;
  color: #1D4ED8;
  border: 1px solid #BFDBFE;
}
```

### Active filter

```css
.filter-active {
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid #93C5FD;
}
```

### Selected complaint card

```css
.card-selected {
  background: #EFF6FF;
  border: 1px solid #93C5FD;
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.14);
}
```

---

## 9. Inputs

Use for:

- textarea;
- input;
- select;
- search;
- coordinate fields.

| State | Color |
|---|---:|
| BG | `#FFFFFF` |
| Text | `#102033` |
| Placeholder | `#94A3B8` |
| Border | `#D9E2EC` |
| Hover Border | `#CBD5E1` |
| Focus Border | `#2563EB` |
| Focus Ring | `#DBEAFE` |
| Disabled BG | `#F1F5F9` |
| Error Border | `#DC2626` |
| Error BG | `#FEF2F2` |
| Error Text | `#991B1B` |

```css
.input {
  background: #FFFFFF;
  color: #102033;
  border: 1px solid #D9E2EC;
}

.input::placeholder {
  color: #94A3B8;
}

.input:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 4px #DBEAFE;
}

.input-error {
  border-color: #DC2626;
  background: #FEF2F2;
  color: #991B1B;
}
```

---

## 10. Cards

### Default card

```css
.card {
  background: #FFFFFF;
  border: 1px solid #D9E2EC;
  box-shadow: 0 8px 24px rgba(16, 32, 51, 0.06);
  border-radius: 20px;
}
```

### Hover card

```css
.card:hover {
  border-color: #CBD5E1;
  box-shadow: 0 12px 32px rgba(16, 32, 51, 0.10);
}
```

### AI preview card

```css
.card-ai {
  background: #FFFFFF;
  border: 1px solid #BAE6FD;
  box-shadow: 0 12px 28px rgba(6, 182, 212, 0.10);
}
```

### Critical card

```css
.card-critical {
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
}
```

---

## 11. Tables

Use for:

- admin complaint table;
- analytics lists;
- status logs.

| Token | HEX |
|---|---:|
| `table.bg` | `#FFFFFF` |
| `table.headerBg` | `#F8FAFC` |
| `table.headerText` | `#5B6B7C` |
| `table.rowText` | `#102033` |
| `table.rowMutedText` | `#5B6B7C` |
| `table.border` | `#E2E8F0` |
| `table.rowHover` | `#F8FAFC` |
| `table.rowSelected` | `#EFF6FF` |

---

## 12. Map colors

### Markers

| Type | HEX |
|---|---:|
| Critical marker | `#DC2626` |
| High marker | `#F97316` |
| Medium marker | `#EAB308` |
| Low marker | `#64748B` |
| Resolved marker | `#16A34A` |

### Clusters

| Count | HEX |
|---|---:|
| 3–4 complaints | `#F97316` |
| 5–9 complaints | `#EA580C` |
| 10+ complaints | `#DC2626` |

### Map panel

| Token | HEX |
|---|---:|
| `map.panel.bg` | `#FFFFFF` |
| `map.panel.border` | `#D9E2EC` |
| `map.fallback.bg` | `#F8FAFC` |
| `map.fallback.border` | `#CBD5E1` |
| `map.fallback.text` | `#5B6B7C` |

---

## 13. Alerts

| Alert | BG | Text | Border |
|---|---:|---:|---:|
| Info | `#EFF6FF` | `#1D4ED8` | `#93C5FD` |
| Success | `#DCFCE7` | `#166534` | `#86EFAC` |
| Warning | `#FEF3C7` | `#92400E` | `#FCD34D` |
| Danger | `#FEE2E2` | `#991B1B` | `#FCA5A5` |

### Emergency warning

```txt
Внимание: если есть непосредственная угроза жизни или здоровью, звоните 112.
```

Use:

```css
background: #FEE2E2;
color: #991B1B;
border: 1px solid #FCA5A5;
```

---

## 14. Charts

Use only these colors in analytics charts.

| Token | HEX |
|---|---:|
| `chart.blue` | `#2563EB` |
| `chart.cyan` | `#06B6D4` |
| `chart.green` | `#16A34A` |
| `chart.orange` | `#F97316` |
| `chart.yellow` | `#EAB308` |
| `chart.red` | `#DC2626` |
| `chart.slate` | `#64748B` |
| `chart.purple` | `#7C3AED` |

Rules:

- priority charts must use priority colors;
- status charts must use status colors;
- do not use random chart colors.

---

## 15. Gradients

### Hero gradient

```css
background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
```

### AI gradient

```css
background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
```

### Critical cluster gradient

```css
background: linear-gradient(135deg, #F97316 0%, #DC2626 100%);
```

### Soft page gradient

```css
background:
  radial-gradient(circle at top left, #DBEAFE 0%, transparent 35%),
  radial-gradient(circle at top right, #CFFAFE 0%, transparent 30%),
  #F6F8FB;
```

Use gradients only for:

- hero;
- AI button;
- AI badge;
- cluster highlight.

---

## 16. Typography

Use Apple-like system font stack. Do not bundle SF Pro font files.

### Main UI font

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Arial, sans-serif;
```

Use for:

- body;
- forms;
- tables;
- cards;
- filters;
- dashboard UI.

### Display font

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Arial, sans-serif;
```

Use for:

- hero title;
- page titles;
- section titles;
- large stats.

### Mono font

```css
font-family: "SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace;
```

Use for:

- public IDs;
- status logs;
- JSON-like previews;
- technical fields.

---

## 17. Typography scale

| Element | Font | Size | Weight | Tracking |
|---|---|---:|---:|---:|
| Hero title | Display | `52–64px` | `750–800` | `-0.045em` |
| Page title | Display | `32–40px` | `700` | `-0.035em` |
| Section title | Display | `24–28px` | `700` | `-0.025em` |
| Card title | UI / Display | `18–20px` | `650` | `-0.02em` |
| Body | UI | `15–16px` | `400` | `-0.01em` |
| Table | UI | `13–14px` | `500` | `-0.005em` |
| Badge | UI | `12px` | `600` | `0em` |
| Public ID | Mono | `12–13px` | `500` | `-0.02em` |
| Stats number | Display | `36–48px` | `750` | `-0.04em` |

---

## 18. Tailwind color tokens

Use this structure in `tailwind.config.ts` if custom Tailwind tokens are used.

```ts
colors: {
  app: {
    bg: "#F6F8FB",
    surface: "#FFFFFF",
    surfaceMuted: "#EEF3F8",
    border: "#D9E2EC",
    borderStrong: "#CBD5E1",
    text: "#102033",
    textMuted: "#5B6B7C",
    placeholder: "#94A3B8",
  },

  primary: {
    DEFAULT: "#2563EB",
    hover: "#1D4ED8",
    active: "#1E40AF",
    soft: "#DBEAFE",
    ring: "#93C5FD",
  },

  accent: {
    DEFAULT: "#06B6D4",
    hover: "#0891B2",
    active: "#0E7490",
    soft: "#CFFAFE",
    ring: "#67E8F9",
  },

  danger: {
    DEFAULT: "#DC2626",
    hover: "#B91C1C",
    active: "#991B1B",
    soft: "#FEE2E2",
    text: "#991B1B",
    border: "#FCA5A5",
  },

  success: {
    DEFAULT: "#16A34A",
    hover: "#15803D",
    active: "#166534",
    soft: "#DCFCE7",
    text: "#166534",
    border: "#86EFAC",
  },

  warning: {
    DEFAULT: "#F97316",
    hover: "#EA580C",
    active: "#C2410C",
    soft: "#FFEDD5",
    text: "#9A3412",
    border: "#FDBA74",
  },

  priority: {
    critical: "#DC2626",
    high: "#F97316",
    medium: "#EAB308",
    low: "#64748B",
    resolved: "#16A34A",
  },

  badge: {
    criticalBg: "#FEE2E2",
    criticalText: "#991B1B",
    criticalBorder: "#FCA5A5",

    highBg: "#FFEDD5",
    highText: "#9A3412",
    highBorder: "#FDBA74",

    mediumBg: "#FEF3C7",
    mediumText: "#92400E",
    mediumBorder: "#FCD34D",

    lowBg: "#F1F5F9",
    lowText: "#475569",
    lowBorder: "#CBD5E1",

    resolvedBg: "#DCFCE7",
    resolvedText: "#166534",
    resolvedBorder: "#86EFAC",
  },
}
```

---

## 19. Component usage map

### Landing page

| Component | Colors |
|---|---|
| Background | `app.bg` |
| Hero | `gradient.hero` |
| Cards | `app.surface` |
| Main CTA | `primary` |
| AI badge | `ai.gradient` |

### Report page

| Component | Colors |
|---|---|
| Form card | `app.surface` |
| Inputs | input tokens |
| Analyze AI button | `button.ai` |
| Submit button | `button.primary` |
| AI preview card | `card.ai` |
| Emergency warning | `alert.danger` |

### Map page

| Component | Colors |
|---|---|
| Page background | `app.bg` |
| Map panel | `app.surface` |
| Markers | priority colors |
| Clusters | cluster colors |
| Selected complaint | selected card |

### Admin page

| Component | Colors |
|---|---|
| Stats cards | `app.surface` |
| Table | table tokens |
| Active filters | `filter.active` |
| Priority badges | priority badge colors |
| Status badges | status colors |
| Drawer | `app.surface` |

### Analytics page

| Component | Colors |
|---|---|
| Stats cards | `app.surface` |
| Charts | chart colors |
| Hot clusters | cluster colors |
| Critical blocks | `alert.danger` |

### Complaint details page

| Component | Colors |
|---|---|
| Status badge | status colors |
| Priority badge | priority colors |
| Timeline dots | status dot colors |
| Public ID | mono font + `app.textMuted` |

---

## 20. Do not do

- Do not use pure black `#000000` for text.
- Do not use pure white as page background everywhere.
- Do not use red except danger, critical, rejected.
- Do not use orange except high, warning, in progress.
- Do not use green except success, resolved.
- Do not use random purple except charts.
- Do not make every element gradient.
- Do not make the UI look like a gaming panel.
- Do not make the UI look like a school poster.
- Do not use dark theme as the primary design.
- Do not use hard shadows.
- Do not overuse borders.
- Do not use too many saturated colors at once.

---

## 21. Final visual target

The final UI should look like:

- official city service;
- modern admin dashboard;
- clean Smart City SaaS;
- readable on a projector;
- easy to understand in a 3-minute demo.

Main impression:

> Trustworthy civic AI platform for Shymkent city services.
