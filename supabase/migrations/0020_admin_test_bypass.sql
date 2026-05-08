alter table public.profiles
  add column if not exists role text not null default 'user',
  add column if not exists account_status text not null default 'active';

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

grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin(auth.uid()) then
    new.role = old.role;
    new.account_status = old.account_status;
    new.admin_notes = old.admin_notes;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_admin_fields on public.profiles;

create trigger protect_profile_admin_fields
before update on public.profiles
for each row
execute function public.protect_profile_admin_fields();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  false,
  524288000,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/aac',
    'audio/wav',
    'audio/x-wav',
    'audio/webm'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
