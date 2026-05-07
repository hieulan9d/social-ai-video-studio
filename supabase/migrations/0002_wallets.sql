create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  balance_credit integer not null default 0 check (balance_credit >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists set_wallets_updated_at on public.wallets;

create trigger set_wallets_updated_at
before update on public.wallets
for each row
execute function public.handle_updated_at();

create or replace function public.handle_new_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_profile_created_create_wallet on public.profiles;

create trigger on_profile_created_create_wallet
after insert on public.profiles
for each row
execute function public.handle_new_wallet();

insert into public.wallets (user_id)
select id
from public.profiles
on conflict (user_id) do nothing;

alter table public.wallets enable row level security;

create policy "Users can view own wallet"
on public.wallets
for select
to authenticated
using (auth.uid() = user_id);
