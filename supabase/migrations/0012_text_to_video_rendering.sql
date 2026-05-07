alter table public.render_jobs
  drop constraint if exists render_jobs_status_check;

alter table public.render_jobs
  add column if not exists user_id uuid references public.profiles (id) on delete cascade,
  add column if not exists render_mode text not null default 'text_to_video',
  add column if not exists credit_cost integer not null default 0,
  add column if not exists prompt_snapshot text,
  add column if not exists provider_operation_name text,
  add column if not exists provider_request jsonb not null default '{}'::jsonb,
  add column if not exists provider_response jsonb not null default '{}'::jsonb,
  add column if not exists output_storage_provider text,
  add column if not exists output_storage_bucket text,
  add column if not exists output_storage_path text,
  add column if not exists output_mime_type text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.render_jobs
set user_id = projects.user_id
from public.projects
where render_jobs.project_id = projects.id
  and render_jobs.user_id is null;

update public.render_jobs
set status = 'queued'
where status in ('pending', 'cancelled');

alter table public.render_jobs
  alter column user_id set not null;

alter table public.render_jobs
  add constraint render_jobs_status_check
  check (status in ('queued', 'processing', 'completed', 'failed'));

alter table public.render_jobs
  drop constraint if exists render_jobs_render_mode_check;

alter table public.render_jobs
  add constraint render_jobs_render_mode_check
  check (render_mode in ('text_to_video'));

create index if not exists render_jobs_user_id_created_at_idx
  on public.render_jobs (user_id, created_at desc);

create index if not exists render_jobs_provider_operation_name_idx
  on public.render_jobs (provider, provider_operation_name)
  where provider_operation_name is not null;

alter table public.generated_videos
  add column if not exists user_id uuid references public.profiles (id) on delete cascade,
  add column if not exists provider text,
  add column if not exists provider_job_id text,
  add column if not exists storage_provider text,
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.generated_videos
set user_id = projects.user_id
from public.projects
where generated_videos.project_id = projects.id
  and generated_videos.user_id is null;

alter table public.generated_videos
  alter column user_id set not null;

create index if not exists generated_videos_user_id_created_at_idx
  on public.generated_videos (user_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-videos',
  'generated-videos',
  false,
  524288000,
  array['video/mp4', 'video/webm', 'application/octet-stream']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own generated video objects" on storage.objects;
drop policy if exists "Users can upload own generated video objects" on storage.objects;
drop policy if exists "Users can update own generated video objects" on storage.objects;
drop policy if exists "Users can delete own generated video objects" on storage.objects;

create policy "Users can read own generated video objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'generated-videos'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'projects'
  and exists (
    select 1 from public.projects
    where projects.id::text = split_part(name, '/', 4)
      and projects.user_id = auth.uid()
  )
);

create policy "Users can upload own generated video objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'generated-videos'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'projects'
  and exists (
    select 1 from public.projects
    where projects.id::text = split_part(name, '/', 4)
      and projects.user_id = auth.uid()
  )
);

create policy "Users can update own generated video objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'generated-videos'
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
  bucket_id = 'generated-videos'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'projects'
  and exists (
    select 1 from public.projects
    where projects.id::text = split_part(name, '/', 4)
      and projects.user_id = auth.uid()
  )
);

create policy "Users can delete own generated video objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'generated-videos'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'projects'
  and exists (
    select 1 from public.projects
    where projects.id::text = split_part(name, '/', 4)
      and projects.user_id = auth.uid()
  )
);
