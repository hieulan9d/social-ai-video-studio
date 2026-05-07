alter table public.project_assets
  drop constraint if exists project_assets_asset_type_check;

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
      'voiceover_audio',
      'music_audio',
      'reference_image',
      'audio'
    )
  );

update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array[
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
where id = 'project-assets';

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'queued',
  export_ratio text not null default '9:16',
  credit_cost integer not null default 0,
  input_video_ids uuid[] not null default '{}'::uuid[],
  options jsonb not null default '{}'::jsonb,
  output_storage_provider text,
  output_storage_bucket text,
  output_storage_path text,
  output_mime_type text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint export_jobs_status_check
    check (status in ('queued', 'processing', 'completed', 'failed')),
  constraint export_jobs_ratio_check
    check (export_ratio in ('9:16', '1:1', '16:9')),
  constraint export_jobs_credit_cost_check
    check (credit_cost >= 0),
  constraint export_jobs_input_video_ids_check
    check (array_length(input_video_ids, 1) is not null)
);

create index if not exists export_jobs_user_project_created_at_idx
  on public.export_jobs (user_id, project_id, created_at desc);

create index if not exists export_jobs_status_created_at_idx
  on public.export_jobs (status, created_at);

drop trigger if exists set_export_jobs_updated_at on public.export_jobs;

create trigger set_export_jobs_updated_at
before update on public.export_jobs
for each row
execute function public.handle_updated_at();

alter table public.export_jobs enable row level security;

drop policy if exists "Users can read own export jobs" on public.export_jobs;
drop policy if exists "Users can insert own export jobs" on public.export_jobs;
drop policy if exists "Users can update own export jobs" on public.export_jobs;

create policy "Users can read own export jobs"
on public.export_jobs
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own export jobs"
on public.export_jobs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.projects
    where projects.id = export_jobs.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "Users can update own export jobs"
on public.export_jobs
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
