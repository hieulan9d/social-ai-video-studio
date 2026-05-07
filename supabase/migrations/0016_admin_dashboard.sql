alter table public.profiles
  add column if not exists role text not null default 'user',
  add column if not exists account_status text not null default 'active',
  add column if not exists admin_notes text;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin'));

alter table public.profiles
  drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended'));

create or replace function public.is_admin(p_user_id uuid)
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

create table if not exists public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'general',
  description text,
  content text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists prompt_templates_active_category_idx
  on public.prompt_templates (is_active, category, name);

drop trigger if exists set_prompt_templates_updated_at on public.prompt_templates;

create trigger set_prompt_templates_updated_at
before update on public.prompt_templates
for each row
execute function public.handle_updated_at();

alter table public.prompt_templates enable row level security;

drop policy if exists "Authenticated users can read active prompt templates" on public.prompt_templates;
drop policy if exists "Admins can manage prompt templates" on public.prompt_templates;

create policy "Authenticated users can read active prompt templates"
on public.prompt_templates
for select
to authenticated
using (
  is_active = true
  or public.is_admin(auth.uid())
);

create policy "Admins can manage prompt templates"
on public.prompt_templates
for all
to authenticated
using (
  public.is_admin(auth.uid())
)
with check (
  public.is_admin(auth.uid())
);

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (
  public.is_admin(auth.uid())
);

create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (
  public.is_admin(auth.uid())
)
with check (
  public.is_admin(auth.uid())
);

grant execute on function public.is_admin(uuid) to authenticated;
