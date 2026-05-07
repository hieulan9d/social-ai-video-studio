create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  credit_package_id uuid references public.credit_packages (id) on delete set null,
  provider text not null,
  provider_payment_id text unique,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null check (
    status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')
  ),
  credits_purchased integer not null default 0 check (credits_purchased >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists payments_user_id_created_at_idx
  on public.payments (user_id, created_at desc);

drop trigger if exists set_payments_updated_at on public.payments;

create trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.handle_updated_at();

alter table public.payments enable row level security;

create policy "Users can view own payments"
on public.payments
for select
to authenticated
using (auth.uid() = user_id);
