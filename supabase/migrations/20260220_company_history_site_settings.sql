-- =====================================================================
-- Regime Energy Services — Company History, Site Settings
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. COMPANY HISTORY (timeline milestones shown on the public website)
-- ---------------------------------------------------------------------
create table if not exists public.company_history (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_history enable row level security;

-- Anyone may READ active history rows (public website)
drop policy if exists "company_history_public_read" on public.company_history;
create policy "company_history_public_read"
  on public.company_history for select
  using (is_active = true);

-- Authenticated admins may do everything (managed from the admin panel)
drop policy if exists "company_history_admin_all" on public.company_history;
create policy "company_history_admin_all"
  on public.company_history for all
  to authenticated
  using (public.has_admin_role(array['super_admin','website_manager','content_manager']))
  with check (public.has_admin_role(array['super_admin','website_manager','content_manager']));

-- ---------------------------------------------------------------------
-- 2. SITE SETTINGS (single global row: social links, footer, SEO meta)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  facebook_url text,
  instagram_url text,
  twitter_url text,
  linkedin_url text,
  youtube_url text,
  footer_note text,
  meta_title text,
  meta_description text,
  show_company_history_link boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Anyone may READ the active settings row (public website)
drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
  on public.site_settings for select
  using (is_active = true);

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all"
  on public.site_settings for all
  to authenticated
  using (public.has_admin_role(array['super_admin','website_manager','content_manager']))
  with check (public.has_admin_role(array['super_admin','website_manager','content_manager']));

-- ---------------------------------------------------------------------
-- 3. ADMIN MANAGEMENT — uses the existing public.profiles table
--    (full_name, role, is_active). Only policies for admin updates are
--    added here; creating Supabase auth users must be done from the
--    Supabase Dashboard (Authentication → Users → Add user).
-- ---------------------------------------------------------------------
-- super_admin may update other admins' role / active status
drop policy if exists "profiles_super_admin_update" on public.profiles;
create policy "profiles_super_admin_update"
  on public.profiles for update
  to authenticated
  using (public.has_admin_role(array['super_admin']))
  with check (public.has_admin_role(array['super_admin']));

-- super_admin may read all profiles (admin management list)
drop policy if exists "profiles_super_admin_select" on public.profiles;
create policy "profiles_super_admin_select"
  on public.profiles for select
  to authenticated
  using (public.has_admin_role(array['super_admin']));
