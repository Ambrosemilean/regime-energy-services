-- Adds an admin-controlled toggle for the "Find a Regime Branch Near You"
-- homepage map. When show_branch_map is false the interactive map is hidden
-- from visitors; branch data itself stays untouched.
alter table public.site_settings
  add column if not exists show_branch_map boolean not null default true;
