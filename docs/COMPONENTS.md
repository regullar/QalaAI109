# Pages And Components

Framework: Next.js App Router.  
UI style: modern civic SaaS/dashboard, light background, compact information density, clear cards, no marketing-only landing page.

## Exact Routes

```txt
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
```

## Exact Component Tree

```txt
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
```

## Exact Library Files

```txt
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
```

## Global Layout

`app/layout.tsx`:
- Render global shell.
- Include `Header`.
- Include main content.
- Include global demo disclaimer from `docs/SPEC.md`.

Do not import 2GIS, Supabase admin client, or browser-only code here.

## Header

`Header.tsx`:
- Product name: `Qala AI`.
- Demo badge.
- Uses `Nav`.
- Should be visible on all pages.

`Nav.tsx` links:
- `/`
- `/report`
- `/map`
- `/admin`
- `/admin/analytics`

## Landing Page

Route: `/`

Components:
- `Hero`
- `FeatureCards`
- `DemoStats`

Hero content:
- Product name.
- One-sentence explanation: AI dispatcher for city complaints in Shymkent.
- Primary action to `/report`.
- Secondary actions to `/map` and `/admin`.

FeatureCards:
- AI classification.
- Smart priority.
- 2GIS problem map.
- Repeating complaint clusters.
- Operator dashboard.
- District analytics.

DemoStats:
- 5 districts.
- 14 categories.
- AI plus fallback classifier.
- Demo source labels.

## Report Page

Route: `/report`

Components:
- `ComplaintForm`
- `AiPreviewCard`
- `EmergencyWarning`
- Optional mini 2GIS picker only if time allows.

`ComplaintForm` fields:
- `rawText` textarea.
- `district` select.
- `addressText` input.
- `source` select.
- Optional `latitude` input.
- Optional `longitude` input.

Buttons:
- Analyze.
- Submit.

Flow:
1. User enters complaint text.
2. Analyze calls `POST /api/complaints/analyze`.
3. `AiPreviewCard` displays the result.
4. Submit calls `POST /api/complaints`.
5. Redirect to `/complaint/[id]`.

`AiPreviewCard` displays:
- Title.
- Category.
- Subcategory.
- District.
- Priority.
- Risk factors.
- Responsible service.
- Generated appeal text.
- Confidence percentage.
- Fallback/AI source if useful.

`EmergencyWarning`:
- Render only when `needsEmergencyWarning = true`.
- Tell user to contact emergency services for immediate danger.

## Complaint Detail Page

Route: `/complaint/[id]`

Display:
- `public_id`
- Status.
- Priority.
- Title.
- Raw text.
- Summary.
- Category.
- Subcategory.
- District.
- Address.
- Responsible service.
- Appeal text.
- Risk factors.
- AI confidence.
- Demo/source label.
- Status timeline.
- Link to map.
- Link to admin dashboard.

MVP data fetch:
- Server component can call internal helper or API-compatible database function.
- Keep it simple.

## Admin Dashboard

Route: `/admin`

Components:
- `ComplaintTable`
- `ComplaintDetailsDrawer`
- `StatusSelect`
- `PriorityBadge`
- `CategoryBadge`
- `ClusterBadge`

Top KPI cards:
- Total complaints.
- New.
- Critical.
- In progress.
- Hot clusters.
- Resolved.

Filters:
- District.
- Category.
- Status.
- Priority.
- Only hot clusters.

`ComplaintTable` columns:
- `public_id`
- Title.
- District.
- Category.
- Priority.
- Status.
- Cluster count.
- Created at.
- Action.

`ComplaintDetailsDrawer` displays:
- Raw text.
- AI summary.
- Category.
- Subcategory.
- Priority.
- District.
- Address.
- Risk factors.
- Responsible service.
- Appeal text.
- Similar complaints.
- Status timeline.
- Status change controls.

`StatusSelect`:
- Valid statuses only.
- Calls `PATCH /api/complaints/[id]/status`.
- Refreshes local row/drawer state after success.

## Analytics Page

Route: `/admin/analytics`

Components:
- `StatsCards`
- `TopCategories`
- `TopDistricts`
- `HotClusters`

Data:
- `GET /api/analytics`.

Show:
- Total complaints.
- Critical count.
- Clusters count.
- Resolved percentage.
- Most frequent category.
- Most active district.
- Top categories.
- Top districts.
- Hot clusters.
- Priority distribution.
- Status distribution.

Charts:
- Use Recharts if available and quick.
- Otherwise use CSS bars and simple lists.
- Do not spend time on advanced chart configuration.

## Map Page

Route: `/map`

Components:
- `TwoGisComplaintMap`
- `MapFilters`
- `ClusterPanel`

Behavior:
- Fetch complaints from `GET /api/complaints`.
- Apply filters.
- Compute clusters in UI or consume analytics helper output.
- Show markers for complaints.
- Toggle cluster mode.
- Show selected complaint panel/card.
- Show `ClusterPanel` on the right on desktop and below map on mobile.

## 2GIS SSR-Safe Strategy

`TwoGisComplaintMap.tsx` must be a client component:

```ts
"use client";
```

Rules:
- Do not import `@2gis/mapgl` at module top level.
- Use dynamic import inside `useEffect`.
- Create map only when `containerRef.current` exists.
- Check `process.env.NEXT_PUBLIC_2GIS_API_KEY` before loading the map.
- Destroy map and markers on unmount.
- Keep map instance in `useRef`.
- Keep markers in `useRef`.
- Never use `window` or `document` outside `useEffect`.
- Never render Leaflet fallback.

Map creation shape:

```ts
const mapgl = await import("@2gis/mapgl");

const map = new mapgl.Map(containerRef.current, {
  center: [69.5901, 42.3417],
  zoom: 12,
  key: process.env.NEXT_PUBLIC_2GIS_API_KEY
});
```

Coordinate rule:

```txt
2GIS MapGL coordinates are [longitude, latitude].
```

Complaint marker:
- Use `[complaint.longitude, complaint.latitude]`.
- If coordinates are missing, either skip marker or create deterministic demo offset around Shymkent center.
- Do not crash on null coordinates.

Missing 2GIS key UI:
- Show a clear warning that 2GIS API key is not configured.
- Still show complaint list and filters.
- State that the map is disabled, but data remains available.
- Do not use another map library.

## Badge Rules

Priority colors:
- `critical`: red.
- `high`: orange.
- `medium`: yellow.
- `low`: gray.
- Resolved complaints may show green status, but priority itself remains unchanged.

Status colors:
- `new`: gray.
- `checking`: yellow.
- `assigned`: blue.
- `in_progress`: orange.
- `resolved`: green.
- `rejected`: red.

## Loading And Empty States

Every data page needs:
- Loading state.
- Empty state.
- Error state.

Required empty states:
- No complaints yet.
- No complaints match filters.
- No hot clusters yet.
- 2GIS key missing.
- AI unavailable, fallback used.

## What Not To Put In Components

- Supabase service role client.
- Direct OpenAI calls.
- Secret environment variables.
- Database writes outside API routes.
- 2GIS top-level imports in server components.
- Real external integration labels that imply production connection.
