# Database Design

Database: Supabase PostgreSQL.  
MVP strategy: two tables, simple indexes, application-computed analytics and clusters.

## Tables

Use these tables only for the hackathon MVP:

- `complaints`: main complaint records.
- `status_logs`: simple status timeline.

Do not add users, roles, departments, files, notifications, realtime, or clustering tables during the hackathon.

## SQL Schema

```sql
create extension if not exists pgcrypto;

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),

  public_id text unique not null,

  raw_text text not null,
  title text not null,
  summary text,

  category text not null,
  subcategory text,
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'new' check (
    status in ('new', 'checking', 'assigned', 'in_progress', 'resolved', 'rejected')
  ),

  district text,
  address_text text,
  latitude double precision,
  longitude double precision,

  responsible_service text,
  appeal_text text,
  risk_factors text[],
  ai_confidence double precision check (
    ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)
  ),

  source text not null default 'Web',
  is_demo boolean not null default true,
  needs_emergency_warning boolean not null default false,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists status_logs (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  old_status text,
  new_status text not null check (
    new_status in ('new', 'checking', 'assigned', 'in_progress', 'resolved', 'rejected')
  ),
  comment text,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_complaints_category
  on complaints(category);

create index if not exists idx_complaints_district
  on complaints(district);

create index if not exists idx_complaints_priority
  on complaints(priority);

create index if not exists idx_complaints_status
  on complaints(status);

create index if not exists idx_complaints_created_at
  on complaints(created_at desc);

create index if not exists idx_complaints_public_id
  on complaints(public_id);

create index if not exists idx_status_logs_complaint_id_created_at
  on status_logs(complaint_id, created_at asc);
```

## Optional Updated At Trigger

Use this only if time allows. It is useful, but not mandatory for the demo.

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_complaints_updated_at on complaints;

create trigger trg_complaints_updated_at
before update on complaints
for each row
execute function set_updated_at();
```

If this trigger is skipped, update `updated_at` manually in the status API route.

## Row Level Security Strategy

Hackathon default:

```sql
alter table complaints enable row level security;
alter table status_logs enable row level security;
```

Recommended simple policies:

```sql
create policy "public read complaints"
on complaints for select
using (true);

create policy "public insert complaints"
on complaints for insert
with check (true);

create policy "public read status logs"
on status_logs for select
using (true);
```

Server route handlers should use the service role key for updates, seed, and analytics. Do not expose service role key to the browser.

If RLS slows development, use service-role-only access from route handlers and keep all database access behind APIs. For the MVP, that is acceptable and simpler.

## Complaint Type

```ts
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
```

## Status Log Type

```ts
export type StatusLog = {
  id: string;
  complaint_id: string;
  old_status: ComplaintStatus | null;
  new_status: ComplaintStatus;
  comment: string | null;
  created_at: string;
};
```

## Demo Data Requirements

Insert 35 to 40 rows.

Distribution:
- Electricity: 10.
- Street lighting: 8.
- Roads and sidewalks: 6.
- Trash and sanitation: 5.
- Public transport: 4.
- Traffic lights and crossings: 3.
- Water supply: 2.
- Safety: 2.

Required hot clusters:
- Nursat + Street lighting: at least 5 complaints.
- Samal + Electricity: at least 5 complaints.
- Kaytpas + Roads and sidewalks: at least 4 complaints.
- Turan + Trash and sanitation: at least 3 complaints.

All demo rows:
- `is_demo = true`.
- Realistic Shymkent-area coordinates.
- Clear source label.
- No claim that rows are official or real citizen reports.

## Cluster Computation

Do not store clusters in the database for MVP.

Compute in `lib/cluster.ts`:

```txt
clusterKey = district + "|" + category + "|" + normalizedAddress
```

If address is empty:

```txt
clusterKey = district + "|" + category
```

Normalize address:
- Lowercase.
- Remove common words like `microdistrict`, `mkr`, `district` when useful.
- Remove punctuation.
- Collapse repeated spaces.
- Trim.

Hot cluster:

```txt
count >= 3
```

Cluster priority:
- `critical` if any complaint is critical.
- Else `high` if any complaint is high.
- Else `medium` if any complaint is medium.
- Else `low`.

## Data Access Rules

- Client components should call API routes, not Supabase directly, unless read-only usage is clearly simpler.
- Route handlers use `SUPABASE_SERVICE_ROLE_KEY`.
- Never import admin Supabase client into a client component.
- Never put service role key in `NEXT_PUBLIC_*`.
