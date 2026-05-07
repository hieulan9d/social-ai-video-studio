create table if not exists public.credit_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  credits integer not null check (credits > 0),
  price_amount numeric(12, 2) not null check (price_amount >= 0),
  currency text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists set_credit_packages_updated_at on public.credit_packages;

create trigger set_credit_packages_updated_at
before update on public.credit_packages
for each row
execute function public.handle_updated_at();

insert into public.credit_packages (slug, name, description, credits, price_amount, currency)
values
  ('starter-100', 'Starter 100', 'Starter top-up package for light usage.', 100, 9.00, 'USD'),
  ('growth-500', 'Growth 500', 'Balanced package for active creators and brands.', 500, 39.00, 'USD'),
  ('agency-1500', 'Agency 1500', 'High-volume package for agencies and operations teams.', 1500, 99.00, 'USD')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  credits = excluded.credits,
  price_amount = excluded.price_amount,
  currency = excluded.currency,
  is_active = true;

alter table public.credit_packages enable row level security;

create policy "Anyone authenticated can view active credit packages"
on public.credit_packages
for select
to authenticated
using (is_active = true);
