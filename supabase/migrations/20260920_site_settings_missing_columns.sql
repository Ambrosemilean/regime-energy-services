-- =====================================================================
-- Regime Energy Services — Fix site_settings missing columns
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- The original migration used `create table if not exists`, which was
-- skipped because the site_settings table already existed in an older
-- form. These columns were therefore never added. This migration adds
-- them safely (no-op if they already exist).
-- ======================================================================

alter table public.site_settings add column if not exists meta_title text;
alter table public.site_settings add column if not exists meta_description text;
alter table public.site_settings add column if not exists show_company_history_link boolean not null default true;
