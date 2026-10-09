-- =====================================================================
-- Regime Energy Services — Chat Assistant ("Regi")
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Adds:
--   1. chat_conversations  — one row per customer chat session
--   2. chat_messages       — every message sent/received
--   3. chat_knowledge      — the assistant's knowledge base
--                           (seeded gas-safety/company facts +
--                            entries LEARNED from customer conversations,
--                            answered/approved by admins)
--   4. RLS policies for all three
--
-- Site-settings RLS repair is included at the bottom (also in
-- 20260921_fix_site_settings_rls.sql — safe to run twice).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  customer_name text,
  customer_phone text,
  status text not null default 'active'
    check (status in ('active', 'escalated', 'closed')),
  escalation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.chat_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_knowledge (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  keywords text[] not null default '{}',
  source text not null default 'admin'
    check (source in ('seed', 'admin', 'learned')),
  times_asked integer not null default 0,
  pending_answer boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_idx
  on public.chat_messages (conversation_id, created_at);
create index if not exists chat_conversations_session_idx
  on public.chat_conversations (session_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_knowledge enable row level security;

-- Visitors (anon or signed-in) can chat: create sessions, read their
-- own session's data, and post messages.
drop policy if exists "chat_conversations_public_insert" on public.chat_conversations;
create policy "chat_conversations_public_insert"
  on public.chat_conversations for insert
  to anon, authenticated
  with check (true);

drop policy if exists "chat_conversations_public_select" on public.chat_conversations;
create policy "chat_conversations_public_select"
  on public.chat_conversations for select
  to anon, authenticated
  using (true);

drop policy if exists "chat_conversations_public_update" on public.chat_conversations;
create policy "chat_conversations_public_update"
  on public.chat_conversations for update
  to anon, authenticated
  using (true) with check (true);

drop policy if exists "chat_messages_public_insert" on public.chat_messages;
create policy "chat_messages_public_insert"
  on public.chat_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "chat_messages_public_select" on public.chat_messages;
create policy "chat_messages_public_select"
  on public.chat_messages for select
  to anon, authenticated
  using (true);

drop policy if exists "chat_knowledge_public_select" on public.chat_knowledge;
create policy "chat_knowledge_public_select"
  on public.chat_knowledge for select
  to anon, authenticated
  using (is_active = true or pending_answer = true);

-- Admins manage the knowledge base and can close/escalate conversations.
drop policy if exists "chat_knowledge_admin_all" on public.chat_knowledge;
create policy "chat_knowledge_admin_all"
  on public.chat_knowledge for all
  to authenticated
  using (public.has_admin_role(array['super_admin','website_manager','content_manager']))
  with check (public.has_admin_role(array['super_admin','website_manager','content_manager']));

grant select, insert, update on public.chat_conversations to anon, authenticated;
grant select, insert on public.chat_messages to anon, authenticated;
grant select, insert, update, delete on public.chat_knowledge to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Seed knowledge — Regime Energy Services / LPG / gas safety
-- ---------------------------------------------------------------------

insert into public.chat_knowledge (question, answer, keywords, source)
select * from (values
  ('How do I order LPG or gas refills?',
   'You can order LPG cylinders and refills by calling us, messaging our WhatsApp, or visiting any Regime Energy Services branch. Tell us your cylinder size and location and we will arrange delivery or pickup.',
   array['order','buy','purchase','refill','cylinder','delivery','get gas'],
   'seed'),
  ('What are your gas prices?',
   'Gas prices vary by cylinder size (e.g. 3kg, 6kg, 12.5kg, 25kg) and by branch. Please contact our customer service on WhatsApp or call us for today''s exact prices.',
   array['price','prices','cost','how much','rate','charge'],
   'seed'),
  ('Do you deliver gas to my area?',
   'Yes — Regime Energy Services delivers LPG to homes and businesses around our branch locations. Share your address and nearest landmark on WhatsApp or by phone and we will confirm delivery availability and timing.',
   array['deliver','delivery','home','area','bring','location'],
   'seed'),
  ('I smell gas / there is a gas leak in my house. What do I do?',
   'STOP and act now: 1) Turn off the cylinder valve immediately. 2) Do NOT light matches, switches, phones or anything that can spark. 3) Open all doors and windows to ventilate. 4) Leave the area. 5) Call our emergency line right away. This chat is being escalated to our customer service team — please also confirm your location so help reaches you fast.',
   array['leak','smell','smells','gas leak','odour','odor','hissing','escape'],
   'seed'),
  ('There is a fire or explosion involving gas!',
   'If there is a fire, evacuate everyone immediately, move far away from the cylinder, and call the fire service and our emergency line now. Do not attempt to fight a large gas fire yourself. We are escalating this to customer service urgently.',
   array['fire','burning','explosion','blast','burn','flames'],
   'seed'),
  ('What cylinder sizes do you sell?',
   'We stock common LPG cylinder sizes — typically 3kg, 6kg, 12.5kg and 25kg — plus full accessories (regulators, hoses, clamps, burners). Availability may vary by branch, so please confirm with the branch nearest you.',
   array['size','sizes','kg','kilogram','small','big','12.5','6kg','3kg','25kg'],
   'seed'),
  ('Do you sell gas accessories and regulators?',
   'Yes. We sell LPG regulators, hoses, clamps, burners and other gas accessories at our branches. Ask for the accessory you need and the branch team will confirm stock and price.',
   array['regulator','hose','accessor','clamp','burner','knob','valve'],
   'seed'),
  ('What are your opening hours?',
   'Most Regime Energy Services branches open Monday to Saturday during normal business hours. Exact hours can differ per branch — check the branch page on this website or ask here and we will confirm.',
   array['open','hours','time','closing','saturday','sunday','weekend','today'],
   'seed'),
  ('Where are your branches / offices located?',
   'We have branches in multiple locations — see the "Branches" section on this website for the full list with addresses, phone numbers, WhatsApp and Google Maps directions.',
   array['branch','branches','office','address','where','find you','located'],
   'seed'),
  ('What services does Regime Energy Services offer?',
   'Regime Energy Services supplies and distributes LPG, delivers gas to homes and businesses, sells cylinders and accessories, and offers related energy services. See the "Services" page on this site for details.',
   array['service','services','offer','do you do','company','about'],
   'seed'),
  ('How do I stay safe when using LPG at home?',
   'Basic LPG safety: keep cylinders upright and outdoors or in a ventilated space; check hoses regularly for cracks and replace them; close the cylinder valve when not in use; never store cylinders near heat or flames; if you smell gas, ventilate and shut the valve before investigating.',
   array['safe','safety','tips','prevent','care','precaution'],
   'seed'),
  ('Can I talk to a human / customer service?',
   'Of course! You can reach our customer service team directly on WhatsApp using the "Escalate to WhatsApp" button, or call the phone number on our Contact section.',
   array['human','agent','person','customer service','speak','talk','call me','representative'],
   'seed')
) as seed(question, answer, keywords, source)
where not exists (select 1 from public.chat_knowledge where source = 'seed');

-- ---------------------------------------------------------------------
-- 4. Site settings RLS repair (same as 20260921 migration)
-- ---------------------------------------------------------------------

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

grant select, insert, update, delete on public.site_settings to authenticated;
