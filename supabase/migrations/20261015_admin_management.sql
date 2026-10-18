-- =====================================================================
-- Regime Energy Services — Admin management hardening
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Uses the EXISTING public.profiles table (id, full_name, role,
-- is_active). No new tables are created. Emails live in auth.users.
--
-- Adds:
--   1. A trigger preventing removal/deactivation of the LAST active
--      super_admin (protects you from locking yourself out).
--   2. Server-side role for creating/deleting admins. Account
--      creation/removal goes through the Supabase Auth admin API
--      (service-role key, server-side only) — passwords stay in
--      Supabase Auth; nothing is stored in SQL.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Guard function: block deleting/disabling the last super_admin
-- ---------------------------------------------------------------------
create or replace function public.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  super_admin_count integer;
begin
  -- Count active super_admins AFTER the attempted change
  select count(*)
  into super_admin_count
  from public.profiles
  where role = 'super_admin'
    and is_active = true
    and (tg_op <> 'DELETE' or id <> old.id);

  if super_admin_count = 0 then
    if tg_op = 'DELETE' then
      raise exception 'Cannot remove the last active super admin.'
        using errcode = 'P0001';
    else
      raise exception 'Cannot disable the last active super admin.'
        using errcode = 'P0001';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists protect_last_super_admin_trigger on public.profiles;
create trigger protect_last_super_admin_trigger
  before delete or update of is_active, role on public.profiles
  for each row
  execute function public.protect_last_super_admin();

-- ---------------------------------------------------------------------
-- 2. RLS on profiles: super_admin can read all profiles (list),
--    update others, and INSERT new admin profiles.
--    Delete of the profile row happens server-side with the
--    service-role key (bypasses RLS), so no delete policy is needed.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_super_admin_select" on public.profiles;
create policy "profiles_super_admin_select"
  on public.profiles for select
  to authenticated
  using (public.has_admin_role(array['super_admin']));

drop policy if exists "profiles_super_admin_update" on public.profiles;
create policy "profiles_super_admin_update"
  on public.profiles for update
  to authenticated
  using (public.has_admin_role(array['super_admin']))
  with check (public.has_admin_role(array['super_admin']));

drop policy if exists "profiles_super_admin_insert" on public.profiles;
create policy "profiles_super_admin_insert"
  on public.profiles for insert
  to authenticated
  with check (public.has_admin_role(array['super_admin']));

-- Everyone can read their own profile (needed for role checks/login)
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. Verify (run these to confirm)
-- ---------------------------------------------------------------------
-- select proname, prosecdef from pg_proc where proname = 'protect_last_super_admin';
-- select policyname, cmd from pg_policies where tablename = 'profiles';
-- select p.id, u.email, p.full_name, p.role, p.is_active
-- from public.profiles p left join auth.users u on u.id = p.id;
