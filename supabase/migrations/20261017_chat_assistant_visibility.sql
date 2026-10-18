-- =====================================================================
-- Regime Energy Services — Chat assistant visibility toggle
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Adds a site_settings column that lets admins show or hide the
-- public chat assistant ("Regi") on the website.
-- ======================================================================

alter table public.site_settings
  add column if not exists show_chat_assistant boolean not null default true;
