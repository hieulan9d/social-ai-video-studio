create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  transaction_type text not null check (
    transaction_type in (
      'signup_bonus',
      'purchase',
      'deduction',
      'refund',
      'adjustment'
    )
  ),
  amount_credit integer not null,
  balance_before integer not null check (balance_before >= 0),
  balance_after integer not null check (balance_after >= 0),
  reason text,
  reference_type text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists credit_transactions_user_id_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

create index if not exists credit_transactions_wallet_id_created_at_idx
  on public.credit_transactions (wallet_id, created_at desc);

alter table public.credit_transactions enable row level security;

create policy "Users can view own credit transactions"
on public.credit_transactions
for select
to authenticated
using (auth.uid() = user_id);
