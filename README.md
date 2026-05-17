# Qala AI

WebDev hackathon MVP built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

Demo disclaimer: this is not an official Akimat or I-Shymkent 109 service.

## Setup

1. Install dependencies:
```bash
npm install
```
2. Create local env file:
```bash
copy .env.example .env.local
```
3. Fill required environment variables in `.env.local`.
4. Start development server:
```bash
npm run dev
```
5. Open:
   - `/`
   - `/report`
   - `/map`
   - `/admin`
   - `/admin/analytics`

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor in Supabase.
3. Run `supabase-schema.sql`.
4. Copy values into `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2GIS API Setup

1. Get 2GIS MapGL API key.
2. Set `NEXT_PUBLIC_2GIS_API_KEY` in `.env.local`.
3. If key is missing, later map pages should render fallback UI without crash.

## OpenAI API Setup

1. Set `OPENAI_API_KEY`.
2. Optional override: set `OPENAI_MODEL` (default `gpt-4o-mini`).
3. If key is missing, later phases use fallback classifier.

## Seed Demo Data (Later Phase)

Seed endpoint is implemented:

```txt
POST /api/seed?token=<SEED_TOKEN>
```

Notes:
- In non-production, seed works without token.
- In production, `SEED_TOKEN` is required.
- Use `?force=1` only when you intentionally reseed non-empty tables.

## Vercel Deploy

1. Push repository to GitHub.
2. Import repository in Vercel as a Next.js project.
3. Build settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output: default
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (recommended: `gpt-4o-mini`)
   - `NEXT_PUBLIC_2GIS_API_KEY`
   - `SEED_TOKEN`
5. Deploy and open production URL.
6. Seed demo data once:
   - `POST /api/seed?token=<SEED_TOKEN>`
7. Run smoke flow:
   - `/` -> `/report` -> analyze -> submit -> `/map` -> `/admin` -> `/admin/analytics`

## Missing Env Behavior

The app is designed to stay up even if some env vars are missing:
- Missing `OPENAI_API_KEY`: analyze route uses fallback classifier.
- Missing `NEXT_PUBLIC_2GIS_API_KEY`: map page shows disabled-map fallback UI.
- Missing Supabase vars: pages show clear error/empty states instead of crashing.
