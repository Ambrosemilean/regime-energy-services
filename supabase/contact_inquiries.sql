-- ============================================================
-- Contact inquiries — smallest necessary schema change.
--
-- Public visitors may INSERT only (via the service-role API route,
-- so anonymous RLS stays closed); no public SELECT/UPDATE/DELETE.
-- Admins manage inquiries through the service role or future
-- admin module; notification status is tracked on the row so a
-- failed email never loses the inquiry.
-- ============================================================

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  reason text not null,
  message text not null,
  created_at timestamptz not null default now(),

  -- Notification tracking: saving the inquiry and emailing the
  -- company are separate operations and can fail independently.
  email_status text not null default 'pending'
    check (email_status in ('pending', 'sent', 'failed')),
  email_error text
);

-- Insert/update policy note: the public API route uses the
-- service-role key (bypasses RLS). No anon policies are created,
-- so anonymous users can neither read other customers' inquiries
-- nor write rows directly through the public Supabase URL.

comment on table public.contact_inquiries is
  'Website contact-form submissions. Public access is service-role only; email_status records notification outcome (pending/sent/failed).';
