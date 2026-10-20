-- =====================================================================
-- Regime Energy Services — Admin phone numbers
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Adds a `phone` column to the existing public.profiles table so
-- admins can store a phone number and later log in with it.
-- Phone numbers are unique (when present).
-- =====================================================================

alter table public.profiles add column if not exists phone text;

-- Partial unique index: multiple NULLs are allowed, but no two
-- admins may share the same phone number.
create unique index if not exists profiles_phone_unique
  on public.profiles (phone)
  where phone is not null;

-- ---------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------
-- select column_name, data_type from information_schema.columns
-- where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone';
-- select indexname, indexdef from pg_indexes where tablename = 'profiles';
