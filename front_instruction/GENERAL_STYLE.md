# GENERAL_STYLE.md — Shymkent 109 AI Hub

## 1. Overall visual direction

**Project:** Shymkent 109 AI Hub  
**Style:** friendly, fancy, iOS-inspired Smart City web platform  
**Goal:** clean, modern, official, premium, soft, readable, demo-ready.

The website must feel like a friendly civic-tech product, not like an old government website or a school project.

### Desired impression

> Friendly iOS-style Smart City dashboard for Shymkent residents and city operators.

### The UI should feel like

- Apple iOS system apps;
- modern SaaS dashboard;
- Smart City civic platform;
- public-service app with friendly UX;
- premium but simple hackathon MVP.

### Avoid

- old government website look;
- dark hacker / gaming UI;
- overloaded enterprise CRM;
- childish colors;
- sharp rectangles;
- inconsistent icons;
- heavy shadows;
- too many gradients.

---

## 2. General visual principles

- Use a light theme as the main style.
- Use soft gray-blue background.
- Use white and translucent cards.
- Use large rounded rectangles and squircle-style shapes.
- Use smooth UI animations.
- Use friendly, clear copywriting.
- Use blue as the main action color.
- Use cyan for AI / Smart City accents.
- Use red/orange/yellow/green only for status and priority.
- Keep spacing generous.
- Keep visual hierarchy obvious.
- Make the UI readable on a projector during a 3-minute demo.

---

## 3. Typography

Use **Roboto** as the main font.

### Main font stack

```css
font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
```

### Mono font stack

```css
font-family: "Roboto Mono", "SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace;
```

### Typography rules

- Use Roboto for all normal UI text.
- Use medium weight for buttons and table text.
- Use bold/semi-bold for headings.
- Use mono only for IDs, logs, technical labels, and JSON-like previews.
- Do not use decorative fonts.
- Do not bundle SF Pro font files.
- Keep line height comfortable.

### Font weights

| Element | Weight |
|---|---:|
| Hero title | `700–800` |
| Page title | `700` |
| Section title | `600–700` |
| Card title | `600` |
| Body text | `400` |
| Buttons | `600` |
| Table text | `500` |
| Badges | `600` |
| Public ID / logs | `500` |

### Font sizes

| Element | Size |
|---|---:|
| Hero title | `52–64px` |
| Page title | `34–42px` |
| Section title | `24–28px` |
| Card title | `18–20px` |
| Body text | `15–16px` |
| Table text | `13–14px` |
| Badge text | `12px` |
| Small helper text | `12–13px` |
| Public ID | `12–13px` |
| Stats number | `36–48px` |

### Letter spacing

| Element | Tracking |
|---|---:|
| Large headings | `-0.035em` |
| Page titles | `-0.025em` |
| Card titles | `-0.015em` |
| Body text | `-0.005em` |
| Buttons | `0em` |
| Badges | `0em` |

---

## 4. Icons

Use **SF Symbols-style icons**.

Actual SF Symbols may not be available in a web runtime. If not, use `lucide-react`, but make icons look like SF Symbols:

```tsx
<Icon size={18} strokeWidth={2} />
```

### Icon principles

- Thin, rounded, clean outline icons.
- Consistent stroke width.
- Avoid heavy filled icons.
- Avoid mixing multiple icon packs.
- Avoid gaming-style icons.
- Icons should support meaning, not dominate the UI.

### Icon sizes

| Place | Size |
|---|---:|
| Header nav | `18px` |
| Buttons | `16–18px` |
| Cards | `20–24px` |
| Stats cards | `22–26px` |
| Empty states | `32–42px` |
| Alerts | `18–20px` |
| Table row actions | `16px` |

### Recommended icon meanings

| Feature | Icon concept |
|---|---|
| AI analysis | sparkle / brain / wand |
| Map | map pin |
| Report | message / document |
| Admin | dashboard / panels |
| Analytics | chart |
| Priority | alert triangle |
| Resolved | check circle |
| Critical | exclamation triangle |
| 2GIS map | map / location |
| Status timeline | clock / activity |
| Cluster | grouped circles / layers |

---

## 5. Shape language

Use **squircle-style rectangles** everywhere.

The UI should not use sharp rectangles.  
The UI should not use fully circular/pill shapes everywhere except badges.

### Border radius scale

| Element | Radius |
|---|---:|
| Main page sections | `32px` |
| Hero card | `32px` |
| Large cards | `28px` |
| Normal cards | `24px` |
| Small cards | `20px` |
| Buttons | `16px` |
| Inputs | `18px` |
| Textarea | `22px` |
| Badges | `999px` |
| Map panel | `28px` |
| Drawer | `28px` |
| Modals | `32px` |
| Segmented controls | `18px` |

### CSS examples

```css
.card {
  border-radius: 24px;
}

.panel {
  border-radius: 28px;
}

.hero-card {
  border-radius: 32px;
}

.button {
  border-radius: 16px;
}

.input {
  border-radius: 18px;
}
```

For a more iOS-like squircle feel:

```css
.squircle {
  border-radius: 28px;
  overflow: hidden;
}
```

---

## 6. Layout style

Use spacious, iOS-like layouts.

### Layout rules

- Use large padding.
- Use clear spacing between sections.
- Avoid cramped UI.
- Keep dashboard blocks visually separated.
- Use cards and panels instead of flat sections.
- Use clear page hierarchy.
- Make important actions obvious.
- Keep primary content centered and readable.
- Use responsive design from the beginning.

### Recommended spacing

| Element | Spacing |
|---|---:|
| Page horizontal padding | `24–40px` |
| Mobile page padding | `16px` |
| Section gap | `32–48px` |
| Card padding | `20–28px` |
| Small card padding | `16–20px` |
| Form field gap | `14–18px` |
| Button height | `44–52px` |
| Input height | `46–52px` |
| Table row height | `52–64px` |
| Drawer padding | `24px` |

### Container

```css
.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px;
}
```

### Mobile container

```css
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }
}
```

---

## 7. Cards and glass style

Cards should feel soft and premium.

### Normal card

```css
.card {
  background: #FFFFFF;
  border: 1px solid #D9E2EC;
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(16, 32, 51, 0.06);
}
```

### Fancy iOS card

Use this for hero, AI preview, selected complaint, and major dashboard blocks:

```css
.fancy-card {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(217, 226, 236, 0.8);
  border-radius: 28px;
  box-shadow: 0 18px 48px rgba(16, 32, 51, 0.10);
  backdrop-filter: blur(20px);
}
```

### Hover card

```css
.card-hover {
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  border-color: #CBD5E1;
  box-shadow: 0 16px 36px rgba(16, 32, 51, 0.10);
}
```

### Selected card

```css
.card-selected {
  background: #EFF6FF;
  border: 1px solid #93C5FD;
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.14);
}
```

---

## 8. Buttons

Buttons should feel iOS-like:

- rounded;
- slightly elevated;
- smooth hover;
- clear pressed state;
- no harsh shadows;
- consistent heights.

### Primary button

Use for:

- “Сообщить о проблеме”;
- “Отправить обращение”;
- “Открыть карту”;
- important confirm actions.

```css
.btn-primary {
  height: 48px;
  padding: 0 20px;
  border-radius: 16px;
  background: #2563EB;
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.22);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.btn-primary:hover {
  background: #1D4ED8;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.26);
}

.btn-primary:active {
  background: #1E40AF;
  transform: scale(0.98);
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.18);
}
```

### AI button

Use for:

- “Проанализировать через AI”;
- “Сгенерировать текст обращения”;
- AI preview actions.

```css
.btn-ai {
  height: 50px;
  padding: 0 22px;`
  border-radius: 18px;
  background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
  color: #FFFFFF;
  font-weight: 700;
  box-shadow: 0 14px 32px rgba(6, 182, 212, 0.26);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}

.btn-ai:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(6, 182, 212, 0.32);
  filter: saturate(1.08);
}

.btn-ai:active {
  transform: scale(0.98);
}
```

### Secondary button

Use for:

- “Назад”;
- “Отмена”;
- “Сбросить фильтры”;
- secondary actions.

```css
.btn-secondary {
  height: 46px;
  padding: 0 18px;
  border-radius: 16px;
  background: #FFFFFF;
  color: #102033;
  border: 1px solid #D9E2EC;
  font-weight: 600;
  transition:
    background 160ms ease,
    transform 160ms ease,
    border-color 160ms ease;
}

.btn-secondary:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
}

.btn-secondary:active {
  transform: scale(0.98);
}
```

### Ghost button

Use for:

- header navigation;
- icon buttons;
- low-emphasis actions.

```css
.btn-ghost {
  height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  background: transparent;
  color: #5B6B7C;
  font-weight: 600;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.btn-ghost:hover {
  background: #EEF3F8;
  color: #102033;
}

.btn-ghost:active {
  transform: scale(0.98);
}

.btn-ghost-active {
  background: #DBEAFE;
  color: #1D4ED8;
}
```

---

## 9. Inputs

Inputs should look like iOS forms.

```css
.input {
  min-height: 48px;
  border-radius: 18px;
  background: #FFFFFF;
  color: #102033;
  border: 1px solid #D9E2EC;
  padding: 0 16px;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.input::placeholder {
  color: #94A3B8;
}

.input:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 4px #DBEAFE;
}

.input:disabled {
  background: #F1F5F9;
  color: #94A3B8;
}

.input-error {
  border-color: #DC2626;
  background: #FEF2F2;
  color: #991B1B;
}
```

### Textarea

```css
.textarea {
  min-height: 140px;
  border-radius: 22px;
  padding: 16px;
  resize: vertical;
}
```

### Input rules

- Inputs must be large enough for quick demo.
- Textarea should be visually important on `/report`.
- Focus state must be clearly visible.
- Error states must be soft red, not aggressive.
- Forms must feel friendly, not bureaucratic.

---

## 10. Animations

Use smooth, subtle UI animations.

The site must feel alive, but not distracting.

### Animation principles

- Use short transitions.
- Use soft movement.
- Use iOS-like spring feel where possible.
- Avoid long animations.
- Avoid excessive bounce.
- Avoid random decorative motion.
- Animate useful state changes only.

### Standard timings

| Interaction | Duration |
|---|---:|
| Button hover | `140–180ms` |
| Button active | `80–120ms` |
| Card hover | `180–220ms` |
| Drawer open | `220–280ms` |
| Modal open | `220–280ms` |
| Page section reveal | `300–450ms` |
| Map marker appear | `180–260ms` |
| Toast | `220ms` |
| Skeleton shimmer | `1.2s` |

### Easing

Use:

```css
transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
```

or:

```css
transition-timing-function: ease-out;
```

### Framer Motion defaults

If Framer Motion is used:

```ts
const smoothTransition = {
  duration: 0.28,
  ease: [0.2, 0.8, 0.2, 1],
};

const springTransition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};
```

### Page reveal

```tsx
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
```

### Card reveal

```tsx
initial={{ opacity: 0, y: 10, scale: 0.98 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
```

### Drawer animation

```tsx
initial={{ x: 32, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
exit={{ x: 32, opacity: 0 }}
transition={{ type: "spring", stiffness: 420, damping: 34 }}
```

### Button tap

```tsx
whileTap={{ scale: 0.98 }}
```

### Card hover

```tsx
whileHover={{ y: -2 }}
```

---

## 11. Microinteractions

Add small microinteractions where useful.

### Required microinteractions

- Button hover and active press.
- Card hover lift.
- AI preview appears with fade/slide.
- Admin drawer slides in.
- Selected complaint card highlights smoothly.
- Map markers appear smoothly.
- Status change shows toast or visual feedback.
- Filter active state changes smoothly.
- Loading states use soft skeletons.
- Analytics cards count smoothly if easy to implement.
- Emergency warning appears with subtle slide/fade.

### Loading skeleton

```css
.skeleton {
  background: linear-gradient(90deg, #EEF3F8 0%, #F8FAFC 50%, #EEF3F8 100%);
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
}

@keyframes skeleton {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
```

---

## 12. iOS-style details

Use these details to make the interface feel polished.

### Soft blur header

```css
.header {
  background: rgba(246, 248, 251, 0.76);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(217, 226, 236, 0.7);
}
```

### Floating panels

```css
.floating-panel {
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(217, 226, 236, 0.8);
  border-radius: 28px;
  box-shadow: 0 20px 60px rgba(16, 32, 51, 0.12);
}
```

### Segmented controls

Use iOS-like segmented controls for filters where appropriate.

```css
.segmented {
  display: inline-flex;
  padding: 4px;
  border-radius: 18px;
  background: #EEF3F8;
}

.segmented-item {
  border-radius: 14px;
  padding: 8px 14px;
  color: #5B6B7C;
  transition: all 160ms ease;
}

.segmented-item-active {
  background: #FFFFFF;
  color: #1D4ED8;
  box-shadow: 0 4px 14px rgba(16, 32, 51, 0.08);
}
```

### Toast

```css
.toast {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(217, 226, 236, 0.85);
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(16, 32, 51, 0.14);
}
```

---

## 13. Page-specific style

### Landing page

Style:

- fancy;
- friendly;
- more visual than admin pages;
- strong hero;
- big rounded cards;
- soft gradients;
- clear CTA.

Must include:

- large hero title;
- AI gradient badge;
- soft background gradient;
- feature cards;
- demo stats;
- clear CTA buttons.

Landing page target:

> A visitor should understand the project in 10 seconds.

---

### Report page

Style:

- friendly form;
- not bureaucratic;
- big textarea;
- clear AI preview;
- smooth “analyze” moment.

Important:

- The user should feel that reporting a problem is easy.
- The textarea should be the center of the page.
- AI preview should feel like a helpful assistant.
- Emergency warning must be visible but not frightening unless needed.

Report page flow:

1. User writes problem.
2. User clicks AI analyze.
3. AI preview card appears with animation.
4. User confirms and submits.
5. User sees created complaint.

---

### Map page

Style:

- practical;
- spatial;
- dashboard-like;
- 2GIS map is the main object;
- floating filters/panels.

Important:

- Map should occupy most of the page.
- Filters should be easy to access.
- Markers must be color-coded by priority.
- Cluster panel must clearly show hot zones.
- If 2GIS key is missing, show a polished fallback card.

Map page target:

> The jury should immediately see “Smart City monitoring”.

---

### Admin page

Style:

- professional operator dashboard;
- clean table;
- clear priority/status badges;
- drawer details;
- fast status actions.

Important:

- Admin must not feel like a mockup.
- Use real workflow language: new, checking, assigned, in progress, resolved.
- Drawer should make the project feel production-like.
- AI summary and risk factors should be prominent.

Admin page target:

> The operator sees not raw chaos, but structured AI output.

---

### Analytics page

Style:

- clean executive dashboard;
- stats cards;
- top categories;
- top districts;
- hot clusters;
- clear problem zones.

Important:

- Hot clusters are the “wow” feature.
- Make cluster cards visually stronger than normal lists.
- Use charts only if they look clean and do not slow development.
- Custom CSS bars are acceptable for hackathon MVP.

Analytics page target:

> The city sees repeated problem zones, not separate complaints.

---

### Complaint details page

Style:

- public case page;
- clear status;
- timeline;
- official text;
- AI analysis.

Important:

- Public ID should use mono font.
- Status timeline should feel transparent.
- Page should be shareable and readable.

---

## 14. Component style rules

### Header

- Sticky or top fixed if it does not cause bugs.
- Soft blur background.
- Rounded active nav item.
- Compact but readable.
- Include demo badge.

### Demo badge

Text:

```txt
Demo Smart City MVP
```

Style:

- small;
- rounded pill;
- soft blue/cyan background;
- not too loud.

### Disclaimer

Use this text where relevant:

```txt
Не является официальным сервисом акимата или I-Shymkent 109.
```

Style:

- small;
- muted;
- visible enough;
- not alarming.

### AI preview card

Must show:

- title;
- category;
- priority;
- district;
- responsible service;
- risk factors;
- official appeal text;
- confidence.

Style:

- AI gradient small header/badge;
- soft cyan border;
- rounded 28px;
- subtle animation on appear.

### Priority badge

- Use priority colors.
- Always keep text readable.
- Use soft background and colored text.
- Do not use fully saturated background for badges except map markers.

### Status badge

- Use status colors.
- Add small dot if possible.
- Keep table rows clean.

### Empty states

Use friendly messages.

Example:

```txt
Пока нет обращений. Создайте первое обращение через форму.
```

Empty state style:

- soft card;
- outline icon;
- muted text;
- one clear CTA.

---

## 15. Responsive behavior

The site must work on:

- laptop;
- projector;
- phone browser.

### Desktop

- Use full dashboard layout.
- Map and admin pages can use multi-column layouts.
- Drawers can appear from the right.

### Tablet

- Reduce gaps.
- Stack some cards.
- Keep map visible.

### Mobile

- Stack everything vertically.
- Header can become simple wrapped nav or horizontal scroll.
- Tables can become cards if easier.
- Buttons should be full-width on forms.
- Drawer can become bottom sheet or full-screen panel.

---

## 16. Accessibility

- Keep text contrast high.
- Do not rely only on color for status; use labels too.
- Buttons must have clear text.
- Inputs must have labels.
- Focus states must be visible.
- Map fallback must be readable.
- Critical alerts must be obvious.

---

## 17. Do not do

- Do not use sharp rectangles.
- Do not use dark theme as primary.
- Do not make every card glass.
- Do not use too many animations.
- Do not use random colors outside STYLE.md.
- Do not use inconsistent icons.
- Do not overuse gradients.
- Do not make buttons tiny.
- Do not make forms cramped.
- Do not use pure black text.
- Do not create a gaming/neon aesthetic.
- Do not make the interface look like a school poster.

---

## 18. Codex implementation note

When implementing this style:

- Prefer Tailwind utility classes.
- Create reusable components for buttons, badges, cards, and panels.
- Keep styling consistent.
- Do not overengineer a full design system if time is short.
- Use CSS variables only if it helps maintain consistency.
- Do not break Vercel deployment.
- Keep 2GIS map client-side only.
- Make UI polished enough for a hackathon demo.

---

## 19. Final visual target

The final UI should look like:

- friendly iOS-style civic app;
- fancy but not childish;
- clean Smart City SaaS;
- modern admin dashboard;
- readable on a projector;
- smooth and pleasant to use;
- easy to understand in a 3-minute demo.

Main impression:

> A friendly, premium, iOS-inspired AI platform for Shymkent city services.
