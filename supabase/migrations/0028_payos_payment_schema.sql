create extension if not exists pgcrypto;

create table if not exists public.credit_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits integer not null,
  price_vnd integer not null,
  bonus_credits integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.credit_packages
  add column if not exists name text,
  add column if not exists credits integer,
  add column if not exists price_vnd integer,
  add column if not exists bonus_credits integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'credit_packages'
      and column_name = 'price_amount'
  ) then
    update public.credit_packages
    set
      price_vnd = coalesce(price_vnd, greatest(1, round(price_amount)::integer)),
      bonus_credits = coalesce(bonus_credits, 0),
      is_active = coalesce(is_active, true),
      sort_order = coalesce(sort_order, 0),
      updated_at = coalesce(updated_at, now())
    where price_vnd is null
       or bonus_credits is null
       or is_active is null
       or sort_order is null
       or updated_at is null;
  else
    update public.credit_packages
    set
      price_vnd = coalesce(price_vnd, 1),
      bonus_credits = coalesce(bonus_credits, 0),
      is_active = coalesce(is_active, true),
      sort_order = coalesce(sort_order, 0),
      updated_at = coalesce(updated_at, now())
    where price_vnd is null
       or bonus_credits is null
       or is_active is null
       or sort_order is null
       or updated_at is null;
  end if;
end $$;

alter table public.credit_packages
  alter column name set not null,
  alter column credits set not null,
  alter column price_vnd set not null,
  alter column bonus_credits set not null,
  alter column is_active set not null,
  alter column sort_order set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.credit_packages
  drop constraint if exists credit_packages_credits_check,
  drop constraint if exists credit_packages_price_vnd_check,
  drop constraint if exists credit_packages_bonus_credits_check;

alter table public.credit_packages
  add constraint credit_packages_credits_check check (credits > 0),
  add constraint credit_packages_price_vnd_check check (price_vnd > 0),
  add constraint credit_packages_bonus_credits_check check (bonus_credits >= 0);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid references public.credit_packages(id) on delete set null,
  provider text not null default 'payos',
  order_code bigint unique not null,
  amount_vnd integer not null,
  credits integer not null,
  bonus_credits integer not null default 0,
  total_credits integer not null,
  status text not null default 'pending',
  checkout_url text,
  qr_code text,
  payment_link_id text,
  transaction_id text,
  credit_transaction_id uuid references public.credit_transactions(id) on delete set null,
  raw_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_orders
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists package_id uuid references public.credit_packages(id) on delete set null,
  add column if not exists provider text not null default 'payos',
  add column if not exists order_code bigint,
  add column if not exists amount_vnd integer,
  add column if not exists credits integer,
  add column if not exists bonus_credits integer not null default 0,
  add column if not exists total_credits integer,
  add column if not exists status text not null default 'pending',
  add column if not exists checkout_url text,
  add column if not exists qr_code text,
  add column if not exists payment_link_id text,
  add column if not exists transaction_id text,
  add column if not exists credit_transaction_id uuid references public.credit_transactions(id) on delete set null,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb,
  add column if not exists paid_at timestamptz,
  add column if not exists credited_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

with missing_order_codes as (
  select
    id,
    (
      floor(extract(epoch from coalesce(created_at, now())) * 1000000)::bigint +
      row_number() over (order by coalesce(created_at, now()), id)
    ) as generated_order_code
  from public.payment_orders
  where order_code is null
)
update public.payment_orders as payment_order
set order_code = missing_order_codes.generated_order_code
from missing_order_codes
where payment_order.id = missing_order_codes.id;

update public.payment_orders
set
  provider = coalesce(provider, 'payos'),
  bonus_credits = coalesce(bonus_credits, 0),
  total_credits = coalesce(total_credits, credits + coalesce(bonus_credits, 0)),
  status = coalesce(status, 'pending'),
  raw_payload = coalesce(raw_payload, '{}'::jsonb),
  updated_at = coalesce(updated_at, now())
where provider is null
   or bonus_credits is null
   or total_credits is null
   or status is null
   or raw_payload is null
   or updated_at is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_orders'
      and column_name = 'amount'
  ) then
    update public.payment_orders
    set amount_vnd = coalesce(amount_vnd, amount)
    where amount_vnd is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_orders'
      and column_name = 'pay_url'
  ) then
    update public.payment_orders
    set checkout_url = coalesce(checkout_url, pay_url)
    where checkout_url is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_orders'
      and column_name = 'qr_code_url'
  ) then
    update public.payment_orders
    set qr_code = coalesce(qr_code, qr_code_url)
    where qr_code is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_orders'
      and column_name = 'momo_trans_id'
  ) then
    update public.payment_orders
    set transaction_id = coalesce(transaction_id, momo_trans_id)
    where transaction_id is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_orders'
      and column_name = 'raw_ipn_payload'
  ) then
    update public.payment_orders
    set raw_payload = raw_ipn_payload
    where raw_payload = '{}'::jsonb
      and raw_ipn_payload <> '{}'::jsonb;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_orders'
      and column_name = 'raw_create_response'
  ) then
    update public.payment_orders
    set raw_payload = raw_create_response
    where raw_payload = '{}'::jsonb
      and raw_create_response <> '{}'::jsonb;
  end if;
end $$;

alter table public.payment_orders
  alter column user_id set not null,
  alter column provider set not null,
  alter column order_code set not null,
  alter column amount_vnd set not null,
  alter column credits set not null,
  alter column bonus_credits set not null,
  alter column total_credits set not null,
  alter column status set not null,
  alter column raw_payload set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.payment_orders
  drop constraint if exists payment_orders_provider_check,
  drop constraint if exists payment_orders_status_check,
  drop constraint if exists payment_orders_amount_vnd_check,
  drop constraint if exists payment_orders_amount_check,
  drop constraint if exists payment_orders_credits_check,
  drop constraint if exists payment_orders_bonus_credits_check,
  drop constraint if exists payment_orders_total_credits_check;

alter table public.payment_orders
  add constraint payment_orders_provider_check check (provider in ('payos', 'momo')),
  add constraint payment_orders_status_check check (status in ('pending', 'paid', 'credited', 'failed', 'cancelled', 'expired')),
  add constraint payment_orders_amount_vnd_check check (amount_vnd > 0),
  add constraint payment_orders_credits_check check (credits > 0),
  add constraint payment_orders_bonus_credits_check check (bonus_credits >= 0),
  add constraint payment_orders_total_credits_check check (total_credits = credits + bonus_credits);

drop index if exists public.payment_orders_order_code_idx;

create unique index payment_orders_order_code_idx
  on public.payment_orders (order_code);

create index if not exists payment_orders_user_id_created_at_idx
  on public.payment_orders (user_id, created_at desc);

create index if not exists payment_orders_status_idx
  on public.payment_orders (status);

do $$
begin
  if exists (
    select 1
    from pg_proc
    where proname = 'set_updated_at'
      and pronamespace = 'public'::regnamespace
  ) then
    drop trigger if exists set_credit_packages_updated_at on public.credit_packages;
    create trigger set_credit_packages_updated_at
    before update on public.credit_packages
    for each row
    execute function public.set_updated_at();

    drop trigger if exists set_payment_orders_updated_at on public.payment_orders;
    create trigger set_payment_orders_updated_at
    before update on public.payment_orders
    for each row
    execute function public.set_updated_at();
  elsif exists (
    select 1
    from pg_proc
    where proname = 'handle_updated_at'
      and pronamespace = 'public'::regnamespace
  ) then
    drop trigger if exists set_credit_packages_updated_at on public.credit_packages;
    create trigger set_credit_packages_updated_at
    before update on public.credit_packages
    for each row
    execute function public.handle_updated_at();

    drop trigger if exists set_payment_orders_updated_at on public.payment_orders;
    create trigger set_payment_orders_updated_at
    before update on public.payment_orders
    for each row
    execute function public.handle_updated_at();
  end if;
end $$;

alter table public.credit_packages enable row level security;
alter table public.payment_orders enable row level security;

drop policy if exists "Users can read active credit packages" on public.credit_packages;
drop policy if exists "Users can read active payos credit packages" on public.credit_packages;
drop policy if exists "Users can read active momo credit packages" on public.credit_packages;
drop policy if exists "Admins can manage credit packages" on public.credit_packages;
drop policy if exists "Admins can manage payos credit packages" on public.credit_packages;
drop policy if exists "Admins can manage momo credit packages" on public.credit_packages;

create policy "Users can read active credit packages"
on public.credit_packages
for select
to authenticated
using (is_active = true);

create policy "Admins can manage credit packages"
on public.credit_packages
for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "Users can read own payment orders" on public.payment_orders;
drop policy if exists "Users can read own payos payment orders" on public.payment_orders;
drop policy if exists "Users can read own momo payment orders" on public.payment_orders;
drop policy if exists "Admins can read all payment orders" on public.payment_orders;
drop policy if exists "Admins can read all payos payment orders" on public.payment_orders;
drop policy if exists "Admins can read all momo payment orders" on public.payment_orders;

create policy "Users can read own payment orders"
on public.payment_orders
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all payment orders"
on public.payment_orders
for select
to authenticated
using (public.is_admin_user(auth.uid()));

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'credit_packages'
      and column_name = 'slug'
  ) then
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
      ('payos-starter-100', 'Starter', '100 credit cho nhu cầu thử nghiệm.', 100, 49000, 49000, 'VND', 0, 10, true),
      ('payos-basic-300', 'Basic', '300 credit cho creator cá nhân.', 300, 129000, 129000, 'VND', 0, 20, true),
      ('payos-pro-800', 'Pro', '800 credit cho sản xuất nội dung thường xuyên.', 800, 299000, 299000, 'VND', 0, 30, true),
      ('payos-agency-2000', 'Agency', '2000 credit cho team hoặc agency.', 2000, 699000, 699000, 'VND', 0, 40, true)
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
      updated_at = now();
  else
    insert into public.credit_packages (
      name,
      credits,
      price_vnd,
      bonus_credits,
      is_active,
      sort_order
    )
    select *
    from (
      values
        ('Starter', 100, 49000, 0, true, 10),
        ('Basic', 300, 129000, 0, true, 20),
        ('Pro', 800, 299000, 0, true, 30),
        ('Agency', 2000, 699000, 0, true, 40)
    ) as seed(name, credits, price_vnd, bonus_credits, is_active, sort_order)
    where not exists (
      select 1
      from public.credit_packages
      where credit_packages.name = seed.name
        and credit_packages.price_vnd = seed.price_vnd
    );
  end if;
end $$;
