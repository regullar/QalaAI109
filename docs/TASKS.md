# Task Checklist

This is the exact build order for a practical hackathon MVP. Complete phases in order. Do not start later polish until the previous phase works end to end.

## Phase 0 - Constraints

- [ ] Do not implement real external integrations.
- [ ] Do not add complex auth.
- [ ] Do not add Docker, Redis, queues, or background workers.
- [ ] Do not replace 2GIS with Leaflet.
- [ ] Do not make the app depend on AI key or 2GIS key to avoid crashing.
- [ ] Keep every feature demoable from the browser.

## Phase 1 - Project Shape

- [ ] Confirm App Router structure under `app/`.
- [ ] Confirm global layout and Tailwind setup.
- [ ] Add or confirm `.env.example`.
- [ ] Add or confirm README setup instructions.
- [ ] Create folders:
  - `components/layout`
  - `components/landing`
  - `components/report`
  - `components/map`
  - `components/admin`
  - `components/analytics`
  - `lib`
  - `types`

## Phase 2 - Types And Constants

- [ ] Create `types/complaint.ts`.
- [ ] Create `types/analytics.ts`.
- [ ] Create `lib/constants.ts`.
- [ ] Define priorities: `low`, `medium`, `high`, `critical`.
- [ ] Define statuses: `new`, `checking`, `assigned`, `in_progress`, `resolved`, `rejected`.
- [ ] Define source labels: `Web`, `109 Demo`, `WhatsApp Demo`, `Telegram Demo`, `Mobile App Demo`.
- [ ] Define Shymkent center as `lat: 42.3417`, `lng: 69.5901`.

## Phase 3 - Database

- [ ] Create Supabase project.
- [ ] Run schema from `docs/DB.md`.
- [ ] Confirm `complaints` table exists.
- [ ] Confirm `status_logs` table exists.
- [ ] Confirm indexes exist.
- [ ] Copy Supabase URL, anon key, and service role key into local env.

## Phase 4 - Supabase Access

- [ ] Create `lib/supabase.ts` for browser-safe anon client.
- [ ] Create `lib/supabase-admin.ts` for server route handlers.
- [ ] Ensure service role key is used only in server files.
- [ ] Add small helper for API JSON errors.

## Phase 5 - Fallback Classifier

- [ ] Create `lib/fallback-classifier.ts`.
- [ ] Return the same shape as `POST /api/complaints/analyze`.
- [ ] Add emergency keyword branch.
- [ ] Add traffic, lighting, electricity, water, road, transport, trash, and default branches.
- [ ] Include confidence score.
- [ ] Include `needsEmergencyWarning`.

## Phase 6 - AI Analyze

- [ ] Create `lib/ai.ts`.
- [ ] Create `app/api/complaints/analyze/route.ts`.
- [ ] Validate that `text` is present.
- [ ] If `OPENAI_API_KEY` is missing, call fallback classifier.
- [ ] If AI request fails, call fallback classifier.
- [ ] If AI returns invalid JSON, call fallback classifier.
- [ ] Return strict JSON with no markdown.

## Phase 7 - Complaint APIs

- [ ] Create `POST /api/complaints`.
- [ ] Create `GET /api/complaints`.
- [ ] Create `GET /api/complaints/[id]`.
- [ ] Create `PATCH /api/complaints/[id]/status`.
- [ ] Create `GET /api/analytics`.
- [ ] Create `POST /api/seed`.
- [ ] Generate `public_id` as `SH-109-{short timestamp}` or sequential demo-safe value.
- [ ] Insert initial status log on complaint creation.
- [ ] Insert status log on every status change.

## Phase 8 - Cluster Logic

- [ ] Create `lib/cluster.ts`.
- [ ] Implement `normalizeAddress(address)`.
- [ ] Implement `getClusterKey(complaint)`.
- [ ] Implement `groupComplaintsIntoClusters(complaints)`.
- [ ] Hot cluster rule: `count >= 3`.
- [ ] Cluster priority rule: highest priority in group wins.
- [ ] Use same clustering helper in API analytics and UI where needed.

## Phase 9 - Layout And Landing

- [ ] Create `components/layout/Header.tsx`.
- [ ] Create `components/layout/Nav.tsx`.
- [ ] Create landing components:
  - `Hero`
  - `FeatureCards`
  - `DemoStats`
- [ ] Implement `/`.
- [ ] Add required demo disclaimer from `docs/SPEC.md`.
- [ ] Add navigation to `/report`, `/map`, `/admin`, `/admin/analytics`.

## Phase 10 - Report Page

- [ ] Create `components/report/ComplaintForm.tsx`.
- [ ] Create `components/report/AiPreviewCard.tsx`.
- [ ] Create `components/report/EmergencyWarning.tsx`.
- [ ] Implement `/report`.
- [ ] Analyze button calls `POST /api/complaints/analyze`.
- [ ] Submit button calls `POST /api/complaints`.
- [ ] Redirect to `/complaint/[id]` after submit.
- [ ] Show loading, error, and empty states.

## Phase 11 - Complaint Detail

- [ ] Implement `/complaint/[id]`.
- [ ] Fetch by UUID or `public_id`.
- [ ] Show public ID, status, priority, title, raw text, summary, category, district, address, service, appeal text, risk factors, and timeline.
- [ ] Link to `/map` and `/admin`.

## Phase 12 - Admin Dashboard

- [ ] Create `components/admin/ComplaintTable.tsx`.
- [ ] Create `components/admin/ComplaintDetailsDrawer.tsx`.
- [ ] Create `components/admin/StatusSelect.tsx`.
- [ ] Create `components/admin/PriorityBadge.tsx`.
- [ ] Create `components/admin/CategoryBadge.tsx`.
- [ ] Create `components/admin/ClusterBadge.tsx`.
- [ ] Implement `/admin`.
- [ ] Add filters for district, category, status, priority, and hot clusters.
- [ ] Add top KPI cards.
- [ ] Status update calls `PATCH /api/complaints/[id]/status`.

## Phase 13 - 2GIS Map

- [ ] Create `components/map/TwoGisComplaintMap.tsx`.
- [ ] Mark component with `"use client"`.
- [ ] Dynamically import `@2gis/mapgl` inside `useEffect`.
- [ ] Create map only after container ref exists.
- [ ] Destroy map on unmount.
- [ ] Use coordinates in `[longitude, latitude]` order.
- [ ] Center map on `[69.5901, 42.3417]`.
- [ ] Show markers for complaints.
- [ ] Color marker UI by priority if custom markers are practical.
- [ ] Add selected complaint panel.
- [ ] Add `components/map/MapFilters.tsx`.
- [ ] Add `components/map/ClusterPanel.tsx`.
- [ ] Implement `/map`.
- [ ] If 2GIS key is missing, show fallback UI and complaint list. Do not load Leaflet.

## Phase 14 - Analytics

- [ ] Create `components/analytics/StatsCards.tsx`.
- [ ] Create `components/analytics/TopCategories.tsx`.
- [ ] Create `components/analytics/TopDistricts.tsx`.
- [ ] Create `components/analytics/HotClusters.tsx`.
- [ ] Implement `/admin/analytics`.
- [ ] Use `GET /api/analytics`.
- [ ] Show total complaints, critical count, cluster count, resolved percentage, most frequent category, most active district.
- [ ] Show priority and status distributions.

## Phase 15 - Demo Data

- [ ] Create `lib/demo-data.ts`.
- [ ] Add 35 to 40 demo complaints.
- [ ] Ensure all demo rows use `is_demo = true`.
- [ ] Include repeated complaints for at least four hot clusters.
- [ ] Seed only if table is empty or when explicitly allowed by route guard.
- [ ] Display demo-data disclaimer in UI.

## Phase 16 - Vercel Readiness

- [ ] Confirm no route requires filesystem persistence.
- [ ] Confirm no API route requires custom server behavior.
- [ ] Confirm no server component imports `@2gis/mapgl`.
- [ ] Confirm `window` and `document` are used only in client effects.
- [ ] Confirm env vars are documented in `docs/DEPLOYMENT.md`.
- [ ] Confirm app works with missing `OPENAI_API_KEY`.
- [ ] Confirm app works with missing `NEXT_PUBLIC_2GIS_API_KEY`.

## Final Demo Script

- [ ] Open `/`.
- [ ] Submit one complaint from `/report`.
- [ ] Show AI/fallback classification.
- [ ] Open created complaint detail.
- [ ] Open `/map` and show markers/clusters.
- [ ] Open `/admin` and update complaint status.
- [ ] Open `/admin/analytics` and explain hot clusters.

## Do Not Spend Time On

- Pixel-perfect design.
- Real operator authentication.
- Exact municipal department routing.
- Geocoding accuracy.
- Real-time map updates.
- Embeddings or semantic clustering.
- Complex charting.
- Unit test suite beyond quick smoke checks.
- Mobile app packaging.
