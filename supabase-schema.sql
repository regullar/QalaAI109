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

create index if not exists idx_complaints_category on complaints(category);
create index if not exists idx_complaints_district on complaints(district);
create index if not exists idx_complaints_priority on complaints(priority);
create index if not exists idx_complaints_status on complaints(status);
create index if not exists idx_complaints_created_at on complaints(created_at desc);
create index if not exists idx_complaints_public_id on complaints(public_id);
create index if not exists idx_status_logs_complaint_id_created_at
  on status_logs(complaint_id, created_at asc);
