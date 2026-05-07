create or replace function public.ensure_wallet_for_user(p_user_id uuid)
returns public.wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_row public.wallets;
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'You are not allowed to access this wallet';
  end if;

  insert into public.wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into wallet_row
  from public.wallets
  where user_id = p_user_id;

  return wallet_row;
end;
$$;

create or replace function public.apply_wallet_credit_change(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_reason text default null,
  p_reference_type text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  wallet_id uuid,
  user_id uuid,
  balance_credit integer,
  transaction_id uuid,
  transaction_type text,
  amount_credit integer,
  reason text,
  reference_type text,
  reference_id text,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_row public.wallets;
  tx_id uuid;
  next_balance integer;
  current_balance integer;
  tx_created_at timestamptz;
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'You are not allowed to modify this wallet';
  end if;

  if p_amount = 0 then
    raise exception 'Credit change amount cannot be zero';
  end if;

  perform public.ensure_wallet_for_user(p_user_id);

  select *
  into wallet_row
  from public.wallets
  where wallets.user_id = p_user_id
  for update;

  current_balance := wallet_row.balance_credit;
  next_balance := current_balance + p_amount;

  if next_balance < 0 then
    raise exception 'Insufficient credits';
  end if;

  update public.wallets
  set balance_credit = next_balance
  where id = wallet_row.id;

  insert into public.credit_transactions (
    wallet_id,
    user_id,
    transaction_type,
    amount_credit,
    balance_before,
    balance_after,
    reason,
    reference_type,
    reference_id,
    metadata
  )
  values (
    wallet_row.id,
    p_user_id,
    p_transaction_type,
    p_amount,
    current_balance,
    next_balance,
    p_reason,
    p_reference_type,
    p_reference_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id, created_at
  into tx_id, tx_created_at;

  return query
  select
    wallet_row.id,
    p_user_id,
    next_balance,
    tx_id,
    p_transaction_type,
    p_amount,
    p_reason,
    p_reference_type,
    p_reference_id,
    coalesce(p_metadata, '{}'::jsonb),
    tx_created_at;
end;
$$;

create or replace function public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text default null,
  p_reference_type text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  wallet_id uuid,
  user_id uuid,
  balance_credit integer,
  transaction_id uuid,
  transaction_type text,
  amount_credit integer,
  reason text,
  reference_type text,
  reference_id text,
  metadata jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select *
  from public.apply_wallet_credit_change(
    p_user_id,
    abs(p_amount),
    'purchase',
    p_reason,
    p_reference_type,
    p_reference_id,
    p_metadata
  );
$$;

create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text default null,
  p_reference_type text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  wallet_id uuid,
  user_id uuid,
  balance_credit integer,
  transaction_id uuid,
  transaction_type text,
  amount_credit integer,
  reason text,
  reference_type text,
  reference_id text,
  metadata jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select *
  from public.apply_wallet_credit_change(
    p_user_id,
    -abs(p_amount),
    'deduction',
    p_reason,
    p_reference_type,
    p_reference_id,
    p_metadata
  );
$$;

create or replace function public.refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text default null,
  p_reference_type text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  wallet_id uuid,
  user_id uuid,
  balance_credit integer,
  transaction_id uuid,
  transaction_type text,
  amount_credit integer,
  reason text,
  reference_type text,
  reference_id text,
  metadata jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select *
  from public.apply_wallet_credit_change(
    p_user_id,
    abs(p_amount),
    'refund',
    p_reason,
    p_reference_type,
    p_reference_id,
    p_metadata
  );
$$;

grant execute on function public.ensure_wallet_for_user(uuid) to authenticated;
grant execute on function public.add_credits(uuid, integer, text, text, text, jsonb) to authenticated;
grant execute on function public.deduct_credits(uuid, integer, text, text, text, jsonb) to authenticated;
grant execute on function public.refund_credits(uuid, integer, text, text, text, jsonb) to authenticated;
