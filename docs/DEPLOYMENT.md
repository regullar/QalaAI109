# Deployment Guide

Target: Vercel.  
Deployment style: standard Next.js App Router deployment with Supabase as hosted database.

## Deployment Principles

- No Docker.
- No custom server.
- No nginx.
- No pm2.
- No Redis.
- No filesystem persistence.
- No local-only dependencies.
- No background worker requirement.
- No Edge runtime unless absolutely necessary.
- Use standard Next.js route handlers.
- Keep all secrets in Vercel environment variables.

## Required Environment Variables

Local and Vercel:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_2GIS_API_KEY=
SEED_TOKEN=
```

Required for core persistence:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional but recommended:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_2GIS_API_KEY`
- `SEED_TOKEN`

Fallback behavior:
- Missing `OPENAI_API_KEY`: app uses fallback classifier.
- Missing `NEXT_PUBLIC_2GIS_API_KEY`: map page shows clear disabled-map message and still shows complaint data.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Create Supabase project.

4. Run SQL from `docs/DB.md` in Supabase SQL editor.

5. Start local dev server:

```bash
npm run dev
```

6. Seed demo data:

```txt
POST /api/seed?token=<SEED_TOKEN>
```

Only seed after Supabase variables are configured.

## Supabase Setup

1. Create a new Supabase project.
2. Open SQL editor.
3. Run schema from `docs/DB.md`.
4. Copy project URL to `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy anon key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Copy service role key to `SUPABASE_SERVICE_ROLE_KEY`.
7. Keep service role key secret. Never expose it as `NEXT_PUBLIC_*`.

## 2GIS Setup

1. Get a 2GIS MapGL API key.
2. Set `NEXT_PUBLIC_2GIS_API_KEY`.
3. Ensure map component loads `@2gis/mapgl` only on client.
4. Verify `/map` does not crash during SSR.

If the key is unavailable before the demo, keep the fallback message. Do not switch to Leaflet.

## AI Setup

1. Set `OPENAI_API_KEY`.
2. Set `OPENAI_MODEL`, default `gpt-4o-mini`.
3. Keep analyze route timeout short enough for demo reliability.
4. On any AI error, return fallback classifier output.

The demo must still work without AI credentials.

## Vercel Deploy Steps

1. Push repository to GitHub.
2. Open Vercel.
3. Import GitHub repository.
4. Framework preset: Next.js.
5. Build command: `npm run build`.
6. Install command: `npm install`.
7. Output directory: leave default.
8. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `NEXT_PUBLIC_2GIS_API_KEY`
   - `SEED_TOKEN`
9. Deploy.
10. Open production URL.
11. Seed demo data if needed.
12. Test `/`, `/report`, `/map`, `/admin`, `/admin/analytics`.

## Vercel Compatibility Checklist

- [ ] No server file imports `@2gis/mapgl`.
- [ ] No server render path references `window`.
- [ ] No server render path references `document`.
- [ ] Map component has `"use client"`.
- [ ] Map library loads through dynamic import in `useEffect`.
- [ ] API routes use route handlers.
- [ ] API routes do not write to local filesystem.
- [ ] API routes do not require long-running processes.
- [ ] Supabase service role key is server-only.
- [ ] AI failures are caught and converted to fallback output.
- [ ] Missing 2GIS key shows fallback UI.
- [ ] Seed route is protected or disabled after setup.

## Production Smoke Test

After deployment:

1. Open `/`.
2. Open `/report`.
3. Submit a complaint with text only.
4. Confirm analyze result appears.
5. Confirm complaint is created.
6. Open created `/complaint/[id]`.
7. Open `/admin`.
8. Change status to `in_progress`.
9. Open `/admin/analytics`.
10. Open `/map`.
11. If 2GIS key exists, verify markers appear.
12. If 2GIS key is missing, verify fallback message appears and page does not crash.

## Demo Recovery Plan

If AI is down:
- Mention fallback classifier.
- Show that the app still categorizes, prioritizes, and routes complaints.

If 2GIS key is down:
- Show fallback map-disabled UI.
- Use admin table and analytics clusters for the demo.
- Explain map code is built for 2GIS MapGL and intentionally does not use Leaflet.

If Supabase is empty:
- Run seed route.
- If seed is disabled, submit 3 to 5 complaints manually through `/report`.

If Vercel deployment fails:
- Demo local dev server.
- Keep browser tabs open for `/`, `/report`, `/map`, `/admin`, and `/admin/analytics`.

## What Not To Deploy

- Docker image.
- Custom Node server.
- Local SQLite or filesystem database.
- Redis or queue services.
- Experimental Edge runtime.
- Separate backend service.
- Secrets in client-side environment variables.
