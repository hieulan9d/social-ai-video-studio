create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

alter table public.profiles
  add column if not exists plan text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro', 'business'));

create or replace function public.is_admin_user(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'admin'
      and account_status = 'active'
  );
$$;

grant execute on function public.is_admin_user(uuid) to authenticated;

create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  balance integer not null default 0,
  total_added integer not null default 0,
  total_used integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_credits_user_id_key unique(user_id),
  constraint user_credits_balance_check check (balance >= 0),
  constraint user_credits_total_added_check check (total_added >= 0),
  constraint user_credits_total_used_check check (total_used >= 0)
);

create index if not exists user_credits_user_id_idx on public.user_credits(user_id);
create index if not exists profiles_role_idx on public.profiles(role);

drop trigger if exists set_user_credits_updated_at on public.user_credits;
create trigger set_user_credits_updated_at
before update on public.user_credits
for each row execute function public.set_updated_at();

insert into public.user_credits (user_id, balance, total_added, total_used)
select
  w.user_id,
  w.balance_credit,
  coalesce(sum(case when ct.amount_credit > 0 then ct.amount_credit else 0 end), 0),
  coalesce(sum(case when ct.amount_credit < 0 then abs(ct.amount_credit) else 0 end), 0)
from public.wallets w
left join public.credit_transactions ct on ct.wallet_id = w.id
group by w.user_id, w.balance_credit
on conflict (user_id) do update
set
  balance = excluded.balance,
  total_added = excluded.total_added,
  total_used = excluded.total_used,
  updated_at = timezone('utc'::text, now());

create or replace function public.sync_user_credits_from_wallet(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_row public.wallets;
begin
  select *
  into wallet_row
  from public.wallets
  where user_id = p_user_id;

  if wallet_row.id is null then
    return;
  end if;

  insert into public.user_credits (user_id, balance, total_added, total_used)
  select
    wallet_row.user_id,
    wallet_row.balance_credit,
    coalesce(sum(case when ct.amount_credit > 0 then ct.amount_credit else 0 end), 0),
    coalesce(sum(case when ct.amount_credit < 0 then abs(ct.amount_credit) else 0 end), 0)
  from public.credit_transactions ct
  where ct.wallet_id = wallet_row.id
  group by wallet_row.user_id, wallet_row.balance_credit
  on conflict (user_id) do update
  set
    balance = excluded.balance,
    total_added = excluded.total_added,
    total_used = excluded.total_used,
    updated_at = timezone('utc'::text, now());
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_row public.wallets;
  signup_bonus integer := 100;
begin
  insert into public.profiles (id, email, full_name, avatar_url, plan)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url',
    'free'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    plan = coalesce(public.profiles.plan, 'free');

  insert into public.wallets (user_id, balance_credit)
  values (new.id, signup_bonus)
  on conflict (user_id) do update
  set balance_credit = case
    when public.wallets.balance_credit = 0 then signup_bonus
    else public.wallets.balance_credit
  end
  returning * into wallet_row;

  insert into public.user_credits (user_id, balance, total_added, total_used)
  values (new.id, wallet_row.balance_credit, signup_bonus, 0)
  on conflict (user_id) do update
  set
    balance = wallet_row.balance_credit,
    total_added = greatest(public.user_credits.total_added, signup_bonus),
    updated_at = timezone('utc'::text, now());

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
  select
    wallet_row.id,
    new.id,
    'signup_bonus',
    signup_bonus,
    0,
    wallet_row.balance_credit,
    'Tặng credit khi đăng ký tài khoản',
    'signup_bonus',
    new.id::text,
    '{"source":"signup_bonus"}'::jsonb
  where not exists (
    select 1
    from public.credit_transactions
    where user_id = new.id
      and transaction_type = 'signup_bonus'
      and reference_type = 'signup_bonus'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.use_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row record;
begin
  if p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Số credit phải lớn hơn 0.');
  end if;

  select *
  into result_row
  from public.deduct_credits(
    p_user_id,
    p_amount,
    p_reason,
    'credit_service',
    gen_random_uuid()::text,
    coalesce(p_metadata, '{}'::jsonb)
  );

  perform public.sync_user_credits_from_wallet(p_user_id);

  return jsonb_build_object(
    'success', true,
    'balance', result_row.balance_credit,
    'transaction_id', result_row.transaction_id
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', case
        when sqlerrm ilike '%insufficient%' then 'Không đủ credit.'
        else sqlerrm
      end
    );
end;
$$;

create or replace function public.add_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row record;
begin
  if p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Số credit phải lớn hơn 0.');
  end if;

  select *
  into result_row
  from public.add_credits(
    p_user_id,
    p_amount,
    p_reason,
    'credit_service',
    gen_random_uuid()::text,
    coalesce(p_metadata, '{}'::jsonb)
  );

  perform public.sync_user_credits_from_wallet(p_user_id);

  return jsonb_build_object(
    'success', true,
    'balance', result_row.balance_credit,
    'transaction_id', result_row.transaction_id
  );
end;
$$;

create or replace function public.refund_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row record;
begin
  if p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Số credit phải lớn hơn 0.');
  end if;

  select *
  into result_row
  from public.refund_credits(
    p_user_id,
    p_amount,
    p_reason,
    'credit_service_refund',
    gen_random_uuid()::text,
    coalesce(p_metadata, '{}'::jsonb)
  );

  perform public.sync_user_credits_from_wallet(p_user_id);

  return jsonb_build_object(
    'success', true,
    'balance', result_row.balance_credit,
    'transaction_id', result_row.transaction_id
  );
end;
$$;

create or replace function public.adjust_user_credits(
  p_user_id uuid,
  p_new_balance integer,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_row public.wallets;
  current_balance integer;
  amount_delta integer;
  tx_id uuid;
begin
  if p_new_balance < 0 then
    return jsonb_build_object('success', false, 'error', 'Số dư mới không hợp lệ.');
  end if;

  perform public.ensure_wallet_for_user(p_user_id);

  select *
  into wallet_row
  from public.wallets
  where user_id = p_user_id
  for update;

  current_balance := wallet_row.balance_credit;
  amount_delta := p_new_balance - current_balance;

  update public.wallets
  set balance_credit = p_new_balance
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
    'adjustment',
    amount_delta,
    current_balance,
    p_new_balance,
    p_reason,
    'admin_adjustment',
    gen_random_uuid()::text,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into tx_id;

  perform public.sync_user_credits_from_wallet(p_user_id);

  return jsonb_build_object(
    'success', true,
    'balance', p_new_balance,
    'transaction_id', tx_id
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;

drop policy if exists "Users can view own user credits" on public.user_credits;
drop policy if exists "Admins can view all user credits" on public.user_credits;
drop policy if exists "Admins can read all credit transactions" on public.credit_transactions;
drop policy if exists "Admins can read all profiles via is_admin_user" on public.profiles;
drop policy if exists "Admins can update all profiles via is_admin_user" on public.profiles;

create policy "Users can view own user credits"
on public.user_credits
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all user credits"
on public.user_credits
for select
to authenticated
using (public.is_admin_user(auth.uid()));

create policy "Admins can read all credit transactions"
on public.credit_transactions
for select
to authenticated
using (public.is_admin_user(auth.uid()));

create policy "Admins can read all profiles via is_admin_user"
on public.profiles
for select
to authenticated
using (public.is_admin_user(auth.uid()));

create policy "Admins can update all profiles via is_admin_user"
on public.profiles
for update
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

grant execute on function public.use_user_credits(uuid, integer, text, jsonb) to authenticated, service_role;
grant execute on function public.add_user_credits(uuid, integer, text, jsonb) to authenticated, service_role;
grant execute on function public.refund_user_credits(uuid, integer, text, jsonb) to authenticated, service_role;
grant execute on function public.adjust_user_credits(uuid, integer, text, jsonb) to authenticated, service_role;
