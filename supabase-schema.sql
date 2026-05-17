create extension if not exists pgcrypto;

create table if not exists users (
  id text primary key,
  role text not null default 'user' check (role in ('user', 'admin')),
  phone text,
  created_at timestamp with time zone not null default now()
);

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),

  public_id text unique not null,
  user_id text references users(id) on delete set null,

  raw_text text not null,
  title text not null,
  description text,
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
  location_text text,
  location_lat double precision,
  location_lng double precision,

  responsible_service text,
  appeal_text text,
  risk_factors text[],
  ai_confidence double precision check (
    ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)
  ),
  normalized_address text,
  normalized_title text,
  normalized_summary text,
  normalized_text text,
  duplicate_geo_bucket text,
  duplicate_fingerprint_version integer,
  duplicate_ai_hint jsonb,

  source text not null default 'Web',
  is_demo boolean not null default true,
  needs_emergency_warning boolean not null default false,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table complaints add column if not exists user_id text references users(id) on delete set null;
alter table complaints add column if not exists description text;
alter table complaints add column if not exists location_text text;
alter table complaints add column if not exists location_lat double precision;
alter table complaints add column if not exists location_lng double precision;
alter table complaints add column if not exists normalized_address text;
alter table complaints add column if not exists normalized_title text;
alter table complaints add column if not exists normalized_summary text;
alter table complaints add column if not exists normalized_text text;
alter table complaints add column if not exists duplicate_geo_bucket text;
alter table complaints add column if not exists duplicate_fingerprint_version integer;
alter table complaints add column if not exists duplicate_ai_hint jsonb;

update complaints
set
  description = coalesce(description, summary, raw_text),
  location_text = coalesce(location_text, address_text),
  location_lat = coalesce(location_lat, latitude),
  location_lng = coalesce(location_lng, longitude),
  normalized_address = coalesce(
    normalized_address,
    nullif(trim(regexp_replace(regexp_replace(lower(coalesce(address_text, '')), '(мкр|микрорайон|microdistrict|mkr|district|район)', ' ', 'g'), '[^[:alnum:][:space:]]', ' ', 'g')), '')
  ),
  normalized_title = coalesce(
    normalized_title,
    nullif(trim(regexp_replace(lower(coalesce(title, '')), '[^[:alnum:][:space:]]', ' ', 'g')), '')
  ),
  normalized_summary = coalesce(
    normalized_summary,
    nullif(trim(regexp_replace(lower(coalesce(summary, '')), '[^[:alnum:][:space:]]', ' ', 'g')), '')
  ),
  normalized_text = coalesce(
    normalized_text,
    nullif(trim(regexp_replace(lower(coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(raw_text, '')), '[^[:alnum:][:space:]]', ' ', 'g')), '')
  ),
  duplicate_geo_bucket = coalesce(
    duplicate_geo_bucket,
    case
      when latitude is not null and longitude is not null
        then concat(round((latitude / 0.0025)::numeric), ':', round((longitude / 0.0025)::numeric))
      else null
    end
  ),
  duplicate_fingerprint_version = coalesce(duplicate_fingerprint_version, 2);

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

create table if not exists telegram_chats (
  chat_id text primary key,
  title text,
  added_by_user_id text references users(id) on delete set null,
  address_text text,
  district text,
  latitude double precision,
  longitude double precision,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

alter table telegram_chats add column if not exists address_text text;
alter table telegram_chats add column if not exists district text;
alter table telegram_chats add column if not exists latitude double precision;
alter table telegram_chats add column if not exists longitude double precision;

create table if not exists telegram_collection_windows (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null references telegram_chats(chat_id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'processed', 'cancelled')),
  started_at timestamp with time zone not null default now(),
  ends_at timestamp with time zone not null,
  processed_at timestamp with time zone
);

create table if not exists telegram_message_links (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  chat_id text not null references telegram_chats(chat_id) on delete cascade,
  message_id bigint not null,
  telegram_user_id text,
  raw_message text not null,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_complaints_category on complaints(category);
create index if not exists idx_complaints_district on complaints(district);
create index if not exists idx_complaints_priority on complaints(priority);
create index if not exists idx_complaints_status on complaints(status);
create index if not exists idx_complaints_user_id on complaints(user_id);
create index if not exists idx_complaints_created_at on complaints(created_at desc);
create index if not exists idx_complaints_public_id on complaints(public_id);
create index if not exists idx_complaints_duplicate_geo_bucket on complaints(duplicate_geo_bucket);
create index if not exists idx_complaints_category_district on complaints(category, district);
create index if not exists idx_status_logs_complaint_id_created_at
  on status_logs(complaint_id, created_at asc);
create index if not exists idx_telegram_collection_windows_chat_status
  on telegram_collection_windows(chat_id, status);
create index if not exists idx_telegram_message_links_complaint_id
  on telegram_message_links(complaint_id);
create index if not exists idx_telegram_message_links_chat_message
  on telegram_message_links(chat_id, message_id);
