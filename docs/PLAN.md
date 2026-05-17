# Implementation Plan

Project: Qala AI  
Goal: working WebDev hackathon MVP, optimized for a reliable 3-minute demo.

## MVP Scope

Build a Next.js App Router application with Supabase storage, 2GIS MapGL visualization, an AI analyze endpoint with fallback classifier, an operator admin dashboard, analytics, and complaint clusters.

The product must feel like a real smart-city web platform, but the implementation must stay simple. Prefer a working end-to-end demo over perfect abstractions.

## Implementation Order

1. Project baseline
   - Confirm Next.js App Router, TypeScript, Tailwind CSS, and basic project structure.
   - Add environment variable documentation.
   - Do not add complex auth, custom servers, Docker, Redis, queues, or background workers.

2. Shared types and constants
   - Create complaint and analytics types.
   - Create district, category, priority, status, source, and Shymkent coordinate constants.
   - Define a single response shape for AI and fallback classification.

3. Supabase database
   - Create `complaints` and `status_logs` tables.
   - Add simple indexes for filters and ordering.
   - Keep clustering computed in application code for the hackathon.

4. Supabase clients
   - Browser/client client for public reads where needed.
   - Admin client with service role key for route handlers.
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components.

5. Fallback classifier
   - Implement keyword-based classification before the AI route is connected.
   - Ensure it returns the same shape as the AI response.
   - Treat emergency/safety words as `critical`.

6. AI analyze route
   - Implement `POST /api/complaints/analyze`.
   - Use OpenAI-compatible API when `OPENAI_API_KEY` exists.
   - Fall back to local classifier on missing key, timeout, invalid JSON, or API error.
   - Return valid JSON to the UI in all cases.

7. Complaint API routes
   - Implement create, list, get-by-id-or-public-id, status update, analytics, and seed routes.
   - Keep validation small and explicit.
   - Return clear error objects with HTTP status codes.

8. Core UI shell
   - Header, navigation, demo badge, global disclaimer.
   - Pages: `/`, `/report`, `/map`, `/admin`, `/admin/analytics`, `/complaint/[id]`.

9. Report flow
   - Complaint form.
   - Analyze button calls `POST /api/complaints/analyze`.
   - Preview card shows AI/fallback result.
   - Submit button calls `POST /api/complaints`.
   - Redirect to complaint detail or admin page.

10. Admin dashboard
   - Fetch complaints from `GET /api/complaints`.
   - Display KPI cards, filters, table, details drawer, status selector.
   - Status changes call `PATCH /api/complaints/[id]/status`.

11. Cluster logic
   - Group complaints by district + category + normalized address.
   - Hot cluster means `count >= 3`.
   - Use clusters in map, admin, and analytics.

12. 2GIS map
   - Build `TwoGisComplaintMap` as a client-only component.
   - Use dynamic import for `@2gis/mapgl`.
   - Never access `window` or `document` on the server.
   - Show fallback UI when `NEXT_PUBLIC_2GIS_API_KEY` is missing.

13. Analytics page
   - Use `GET /api/analytics`.
   - Show totals, distributions, top categories, top districts, and hot clusters.
   - Use Recharts only if already installed or intentionally added; CSS bars are enough.

14. Demo data
   - Add a seed route that inserts demo complaints only when safe.
   - Include repeated complaints so clusters are visible.
   - Clearly label all demo data.

15. Deployment hardening
   - Verify missing AI key does not break analyze.
   - Verify missing 2GIS key does not crash map page.
   - Verify all API routes work on Vercel route handlers.
   - Verify environment variables are documented.

## Page Flow

1. Juror lands on `/`.
2. Clicks "Report problem" and opens `/report`.
3. Enters a city issue.
4. Clicks analyze.
5. Sees category, priority, risk factors, responsible service, generated official appeal text.
6. Submits complaint.
7. Opens `/map` to see markers and hot clusters.
8. Opens `/admin` to see operator queue and update status.
9. Opens `/admin/analytics` to see city-level insights.

## Hackathon Priorities

Must work:
- Complaint creation.
- AI analyze or fallback analyze.
- Supabase persistence.
- Admin table and status update.
- Analytics totals and clusters.
- 2GIS map when key exists.
- Honest fallback when 2GIS key is missing.
- Vercel deployment.

Can be simple:
- Validation.
- Charts.
- Cluster algorithm.
- Demo authentication.
- Map marker styling.
- Geocoding.

## What Not To Build During The Hackathon

- Real integration with I-Shymkent 109, WhatsApp, Telegram, eGov, or akimat systems.
- Full authentication, roles, permissions, SSO, password reset, or user profiles.
- Real geocoding pipeline.
- SMS, email, push notifications, or operator assignments.
- Realtime subscriptions.
- Background jobs, queues, Redis, cron workers.
- Docker, custom Node server, nginx, pm2, or VPS deployment.
- Complex ML clustering, embeddings, vector database, or semantic search.
- Full audit log beyond basic status logs.
- File uploads and photo moderation.
- Multi-language admin CMS.
- Payment, billing, or legal workflow.
- Offline mobile app.
- Advanced GIS layers beyond complaint markers and simple cluster markers.

## Acceptance Checklist

- `/` explains the demo and has links to report, map, admin, and analytics.
- `/report` supports analyze and submit.
- `POST /api/complaints/analyze` works with AI key and without AI key.
- `POST /api/complaints` creates a Supabase row and initial status log.
- `/complaint/[id]` displays a created complaint.
- `/map` renders 2GIS client-side when key exists.
- `/map` shows a clear 2GIS-key-missing fallback when key is absent.
- `/admin` lists complaints and can update status.
- `/admin/analytics` shows stats and hot clusters.
- Demo seed can populate enough data for a presentation.
- UI includes the required demo disclaimer from `docs/SPEC.md`.
