alter table public.credit_packages
  add column if not exists price_vnd integer,
  add column if not exists bonus_credits integer not null default 0,
  add column if not exists sort_order integer not null default 0;

update public.credit_packages
set
  price_vnd = coalesce(price_vnd, greatest(1, round(price_amount)::integer)),
  bonus_credits = coalesce(bonus_credits, 0),
  sort_order = coalesce(sort_order, 0);

alter table public.credit_packages
  drop constraint if exists credit_packages_price_vnd_check,
  drop constraint if exists credit_packages_bonus_credits_check;

alter table public.credit_packages
  add constraint credit_packages_price_vnd_check check (price_vnd is null or price_vnd > 0),
  add constraint credit_packages_bonus_credits_check check (bonus_credits >= 0);

alter table public.credit_packages
  alter column price_vnd set not null;

insert into public.credit_packages (
  slug,
  name,
  description,
  credits,
  price_amount,
  price_vnd,
  currency,
  bonus_credits,
  sort_order,
  is_active
)
values
  ('momo-starter-100', 'Starter', '100 credit cho nhu cầu thử nghiệm.', 100, 49000, 49000, 'VND', 0, 10, true),
  ('momo-basic-300', 'Basic', '300 credit cho creator cá nhân.', 300, 129000, 129000, 'VND', 0, 20, true),
  ('momo-pro-800', 'Pro', '800 credit cho sản xuất nội dung thường xuyên.', 800, 299000, 299000, 'VND', 0, 30, true),
  ('momo-agency-2000', 'Agency', '2000 credit cho team hoặc agency.', 2000, 699000, 699000, 'VND', 0, 40, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  credits = excluded.credits,
  price_amount = excluded.price_amount,
  price_vnd = excluded.price_vnd,
  currency = excluded.currency,
  bonus_credits = excluded.bonus_credits,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = timezone('utc'::text, now());

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid references public.credit_packages(id) on delete set null,
  provider text not null default 'momo',
  order_id text not null unique,
  request_id text not null unique,
  amount_vnd integer not null,
  credits integer not null,
  bonus_credits integer not null default 0,
  total_credits integer not null,
  status text not null default 'pending',
  pay_url text,
  deeplink text,
  qr_code_url text,
  momo_trans_id text,
  result_code integer,
  message text,
  raw_create_response jsonb not null default '{}'::jsonb,
  raw_ipn_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  credited_at timestamptz,
  credit_transaction_id uuid references public.credit_transactions(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint payment_orders_provider_check check (provider in ('momo')),
  constraint payment_orders_status_check check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled', 'credited')),
  constraint payment_orders_amount_vnd_check check (amount_vnd > 0),
  constraint payment_orders_credits_check check (credits > 0),
  constraint payment_orders_bonus_credits_check check (bonus_credits >= 0),
  constraint payment_orders_total_credits_check check (total_credits = credits + bonus_credits)
);

create index if not exists payment_orders_user_id_created_at_idx
  on public.payment_orders (user_id, created_at desc);

create index if not exists payment_orders_order_id_idx
  on public.payment_orders (order_id);

create index if not exists payment_orders_request_id_idx
  on public.payment_orders (request_id);

create index if not exists payment_orders_status_idx
  on public.payment_orders (status);

drop trigger if exists set_payment_orders_updated_at on public.payment_orders;
create trigger set_payment_orders_updated_at
before update on public.payment_orders
for each row
execute function public.handle_updated_at();

alter table public.credit_packages enable row level security;
alter table public.payment_orders enable row level security;

drop policy if exists "Users can read active momo credit packages" on public.credit_packages;
drop policy if exists "Admins can manage momo credit packages" on public.credit_packages;
drop policy if exists "Users can read own momo payment orders" on public.payment_orders;
drop policy if exists "Admins can read all momo payment orders" on public.payment_orders;

create policy "Users can read active momo credit packages"
on public.credit_packages
for select
to authenticated
using (is_active = true);

create policy "Admins can manage momo credit packages"
on public.credit_packages
for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

create policy "Users can read own momo payment orders"
on public.payment_orders
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all momo payment orders"
on public.payment_orders
for select
to authenticated
using (public.is_admin_user(auth.uid()));
