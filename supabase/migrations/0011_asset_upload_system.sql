alter table public.project_assets
  drop constraint if exists project_assets_asset_type_check;

alter table public.project_assets
  add column if not exists user_id uuid references public.profiles (id) on delete cascade,
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists storage_bucket text not null default 'project-assets',
  add column if not exists storage_path text,
  add column if not exists file_size bigint not null default 0,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

update public.project_assets
set user_id = projects.user_id
from public.projects
where project_assets.project_id = projects.id
  and project_assets.user_id is null;

update public.project_assets
set storage_path = coalesce(storage_path, file_url, 'legacy/' || id::text)
where storage_path is null;

update public.project_assets
set file_name = coalesce(file_name, 'legacy-asset-' || id::text)
where file_name is null;

update public.project_assets
set mime_type = coalesce(mime_type, 'application/octet-stream')
where mime_type is null;

alter table public.project_assets
  alter column user_id set not null,
  alter column storage_path set not null,
  alter column file_name set not null,
  alter column mime_type set not null;

alter table public.project_assets
  add constraint project_assets_asset_type_check
  check (
    asset_type in (
      'product_image',
      'start_image',
      'end_image',
      'avatar_image',
      'logo',
      'background_image',
      'reference_image',
      'audio'
    )
  );

create index if not exists project_assets_user_project_created_at_idx
  on public.project_assets (user_id, project_id, created_at desc);

create unique index if not exists project_assets_storage_identity_idx
  on public.project_assets (storage_provider, storage_bucket, storage_path);

drop trigger if exists set_project_assets_updated_at on public.project_assets;

create trigger set_project_assets_updated_at
before update on public.project_assets
for each row
execute function public.handle_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own project asset objects" on storage.objects;
drop policy if exists "Users can upload own project asset objects" on storage.objects;
drop policy if exists "Users can update own project asset objects" on storage.objects;
drop policy if exists "Users can delete own project asset objects" on storage.objects;

create policy "Users can read own project asset objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-assets'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'projects'
  and exists (
    select 1 from public.projects
    where projects.id::text = split_part(name, '/', 4)
      and projects.user_id = auth.uid()
  )
);

create policy "Users can upload own project asset objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-assets'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'projects'
  and exists (
    select 1 from public.projects
    where projects.id::text = split_part(name, '/', 4)
      and projects.user_id = auth.uid()
  )
);

create policy "Users can update own project asset objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project-assets'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'projects'
  and exists (
    select 1 from public.projects
    where projects.id::text = split_part(name, '/', 4)
      and projects.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'project-assets'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'projects'
  and exists (
    select 1 from public.projects
    where projects.id::text = split_part(name, '/', 4)
      and projects.user_id = auth.uid()
  )
);

create policy "Users can delete own project asset objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-assets'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'projects'
  and exists (
    select 1 from public.projects
    where projects.id::text = split_part(name, '/', 4)
      and projects.user_id = auth.uid()
  )
);
