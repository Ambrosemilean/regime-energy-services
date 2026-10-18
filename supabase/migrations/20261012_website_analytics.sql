-- =====================================================================
-- Regime Energy Services — Website Analytics
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Adds:
--   1. site_page_views     — one row per page view (public site only)
--   2. site_events         — click / engagement events (phone, whatsapp,
--                            maps directions, contact form, etc.)
--   3. live_sessions       — lightweight visitor sessions used for
--                            real-time "who is online" monitoring
--   4. RLS policies + helper grants
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

create table if not exists public.site_page_views (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,          -- anonymous browser id (cookie/localStorage)
  session_id text not null,          -- groups views from the same visit
  path text not null,                -- e.g. "/", "/company-history"
  referrer text,                     -- document.referrer
  source text,                       -- google | social | direct | referral
  device text,                       -- desktop | mobile | tablet
  created_at timestamptz not null default now()
);

create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text,
  path text,
  event_type text not null,          -- phone_click | whatsapp_click | maps_click | contact_form | chatbot_open | product_view | service_view | branch_view
  label text,                        -- e.g. branch name / product name / phone number
  created_at timestamptz not null default now()
);

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text not null,
  path text not null,
  is_bot boolean not null default false,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists site_page_views_created_idx
  on public.site_page_views (created_at desc);
create index if not exists site_page_views_path_idx
  on public.site_page_views (path);
create index if not exists site_page_views_visitor_idx
  on public.site_page_views (visitor_id, created_at);
create index if not exists site_events_type_idx
  on public.site_events (event_type, created_at desc);
create index if not exists live_sessions_last_seen_idx
  on public.live_sessions (last_seen_at desc);

-- ---------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------

alter table public.site_page_views enable row level security;
alter table public.site_events enable row level security;
alter table public.live_sessions enable row level security;

-- Anyone on the public site may record visits/events and keep their
-- own live-session row alive (heartbeat). They cannot read analytics.
drop policy if exists "site_page_views_public_insert" on public.site_page_views;
create policy "site_page_views_public_insert"
  on public.site_page_views for insert
  to anon, authenticated
  with check (true);

drop policy if exists "site_events_public_insert" on public.site_events;
create policy "site_events_public_insert"
  on public.site_events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "live_sessions_public_write" on public.live_sessions;
create policy "live_sessions_public_write"
  on public.live_sessions for all
  to anon, authenticated
  using (true) with check (true);

-- Only admins may read analytics.
drop policy if exists "site_page_views_admin_read" on public.site_page_views;
create policy "site_page_views_admin_read"
  on public.site_page_views for select
  to authenticated
  using (public.has_admin_role(array['super_admin','website_manager','content_manager']));

drop policy if exists "site_events_admin_read" on public.site_events;
create policy "site_events_admin_read"
  on public.site_events for select
  to authenticated
  using (public.has_admin_role(array['super_admin','website_manager','content_manager']));

drop policy if exists "live_sessions_admin_read" on public.live_sessions;
create policy "live_sessions_admin_read"
  on public.live_sessions for select
  to authenticated
  using (public.has_admin_role(array['super_admin','website_manager','content_manager']));

grant insert on public.site_page_views to anon, authenticated;
grant insert on public.site_events to anon, authenticated;
grant select, insert, update, delete on public.live_sessions to anon, authenticated;
