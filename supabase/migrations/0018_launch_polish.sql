alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_metadata jsonb not null default '{}'::jsonb;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  path text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists analytics_events_user_id_idx
on public.analytics_events(user_id);

create index if not exists analytics_events_event_name_created_at_idx
on public.analytics_events(event_name, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "Admins can read analytics events" on public.analytics_events;
drop policy if exists "Service role manages analytics events" on public.analytics_events;

create policy "Admins can read analytics events"
on public.analytics_events
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "Service role manages analytics events"
on public.analytics_events
for all
to service_role
using (true)
with check (true);

drop policy if exists "Anyone can view active credit packages" on public.credit_packages;
drop policy if exists "Anyone can read active feature pricing" on public.feature_pricing;

create policy "Anyone can view active credit packages"
on public.credit_packages
for select
to anon, authenticated
using (is_active = true);

create policy "Anyone can read active feature pricing"
on public.feature_pricing
for select
to anon, authenticated
using (is_active = true);
