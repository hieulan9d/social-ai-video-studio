alter table public.payment_orders
  add column if not exists order_code bigint,
  add column if not exists amount integer,
  add column if not exists checkout_url text,
  add column if not exists qr_code text,
  add column if not exists transaction_id text;

update public.payment_orders
set amount = coalesce(amount, amount_vnd)
where amount is null;

alter table public.payment_orders
  drop constraint if exists payment_orders_provider_check,
  drop constraint if exists payment_orders_amount_check;

alter table public.payment_orders
  add constraint payment_orders_provider_check check (provider in ('momo', 'payos')),
  add constraint payment_orders_amount_check check (amount is null or amount > 0);

create unique index if not exists payment_orders_order_code_idx
  on public.payment_orders (order_code)
  where order_code is not null;

create index if not exists payment_orders_provider_status_idx
  on public.payment_orders (provider, status);

create index if not exists payment_orders_transaction_id_idx
  on public.payment_orders (transaction_id)
  where transaction_id is not null;

update public.credit_packages
set is_active = false,
    updated_at = timezone('utc'::text, now())
where slug in (
  'momo-starter-100',
  'momo-basic-300',
  'momo-pro-800',
  'momo-agency-2000'
);

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
  ('payos-pro-800', 'Pro', '800 credit cho sản xuất nội dung thường xuyên.', 800, 299000, 299000, 'VND', 0, 30, true)
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
