create table if not exists public.smart_routing_settings (
  id integer primary key default 1 check (id = 1),
  prefer_cheapest boolean not null default false,
  prefer_fastest boolean not null default false,
  auto_fallback_on_error boolean not null default true,
  daily_credit_limit_enabled boolean not null default false,
  daily_credit_limit integer,
  per_user_credit_limit_enabled boolean not null default false,
  per_user_credit_limit integer,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint smart_routing_settings_daily_credit_limit_check
    check (daily_credit_limit is null or daily_credit_limit >= 0),
  constraint smart_routing_settings_per_user_credit_limit_check
    check (per_user_credit_limit is null or per_user_credit_limit >= 0)
);

insert into public.smart_routing_settings (
  id,
  prefer_cheapest,
  prefer_fastest,
  auto_fallback_on_error,
  daily_credit_limit_enabled,
  daily_credit_limit,
  per_user_credit_limit_enabled,
  per_user_credit_limit
)
values (1, false, false, true, false, null, false, null)
on conflict (id) do nothing;

drop trigger if exists set_smart_routing_settings_updated_at on public.smart_routing_settings;

create trigger set_smart_routing_settings_updated_at
before update on public.smart_routing_settings
for each row
execute function public.handle_updated_at();

alter table public.smart_routing_settings enable row level security;

create policy "Authenticated users can view smart routing settings"
on public.smart_routing_settings
for select
to authenticated
using (true);
