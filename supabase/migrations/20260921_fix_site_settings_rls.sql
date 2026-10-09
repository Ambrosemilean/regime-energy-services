-- =====================================================================
-- Regime Energy Services — Fix site_settings RLS policies
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Fixes: "new row violates row-level security policy for table
-- site_settings" when an admin saves site settings.
--
-- Step 1 diagnostics: run the SELECTs below first and check the
-- output before running step 2.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DIAGNOSTICS — check what exists right now
-- ---------------------------------------------------------------------

-- a) Does has_admin_role exist, and is it SECURITY DEFINER?
select proname, prosecdef
from pg_proc
where proname = 'has_admin_role';

-- b) What policies exist on site_settings?
select policyname, cmd, roles
from pg_policies
where tablename = 'site_settings';

-- c) What is your profile's role? Join auth.users for the email
--    (public.profiles has no email column).
select p.id, u.email, p.role, p.is_active
from public.profiles p
left join auth.users u on u.id = p.id
limit 10;

-- c2) Or, simplest — just check the signed-in user's profile:
select id, full_name, role, is_active from public.profiles where id = auth.uid();

-- ---------------------------------------------------------------------
-- 2. REPAIR
-- ---------------------------------------------------------------------

-- a) Ensure has_admin_role exists (SECURITY DEFINER so RLS on profiles
--    doesn't block the check). Skip if it already exists and works.
create or replace function public.has_admin_role(required_roles text[])
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = any(required_roles)
  );
end;
$$;

-- b) Ensure the site_settings policies exist and are correct.
alter table public.site_settings enable row level security;

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

-- c) Grant authenticated users the ability to write (RLS still gates it)
grant select, insert, update, delete on public.site_settings to authenticated;
