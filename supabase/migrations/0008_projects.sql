create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  platform text not null check (
    platform in ('TikTok', 'Reels', 'Shorts', 'Facebook', 'Shopee')
  ),
  video_type text not null check (
    video_type in ('text_to_video', 'image_to_video', 'start_end_image_to_video')
  ),
  duration integer not null check (duration > 0),
  style text,
  language text not null,
  status text not null default 'draft' check (
    status in ('draft', 'brief_ready', 'script_ready', 'rendering', 'completed', 'archived')
  ),
  brief text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists projects_user_id_updated_at_idx
  on public.projects (user_id, updated_at desc);

drop trigger if exists set_projects_updated_at on public.projects;

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.handle_updated_at();

alter table public.projects enable row level security;

create policy "Users can view own projects"
on public.projects
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own projects"
on public.projects
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own projects"
on public.projects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own projects"
on public.projects
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  asset_type text not null check (
    asset_type in ('reference_image', 'product_image', 'start_image', 'end_image', 'logo', 'audio')
  ),
  file_name text,
  file_url text,
  mime_type text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists project_assets_project_id_created_at_idx
  on public.project_assets (project_id, created_at desc);

alter table public.project_assets enable row level security;

create policy "Users can manage assets for own projects"
on public.project_assets
for all
to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = project_assets.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = project_assets.project_id
      and projects.user_id = auth.uid()
  )
);

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  content text,
  hook text,
  problem text,
  solution text,
  cta text,
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists set_scripts_updated_at on public.scripts;

create trigger set_scripts_updated_at
before update on public.scripts
for each row
execute function public.handle_updated_at();

alter table public.scripts enable row level security;

create policy "Users can manage scripts for own projects"
on public.scripts
for all
to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = scripts.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = scripts.project_id
      and projects.user_id = auth.uid()
  )
);

create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scene_order integer not null,
  title text,
  description text,
  duration_seconds integer,
  camera_direction text,
  character_direction text,
  voice_script text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (project_id, scene_order)
);

create index if not exists scenes_project_id_scene_order_idx
  on public.scenes (project_id, scene_order);

drop trigger if exists set_scenes_updated_at on public.scenes;

create trigger set_scenes_updated_at
before update on public.scenes
for each row
execute function public.handle_updated_at();

alter table public.scenes enable row level security;

create policy "Users can manage scenes for own projects"
on public.scenes
for all
to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = scenes.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = scenes.project_id
      and projects.user_id = auth.uid()
  )
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scene_id uuid references public.scenes (id) on delete set null,
  prompt_type text not null default 'veo',
  content text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists prompts_project_id_created_at_idx
  on public.prompts (project_id, created_at desc);

drop trigger if exists set_prompts_updated_at on public.prompts;

create trigger set_prompts_updated_at
before update on public.prompts
for each row
execute function public.handle_updated_at();

alter table public.prompts enable row level security;

create policy "Users can manage prompts for own projects"
on public.prompts
for all
to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = prompts.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = prompts.project_id
      and projects.user_id = auth.uid()
  )
);

create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scene_id uuid references public.scenes (id) on delete set null,
  prompt_id uuid references public.prompts (id) on delete set null,
  status text not null default 'pending' check (
    status in ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled')
  ),
  provider text,
  provider_job_id text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists render_jobs_project_id_created_at_idx
  on public.render_jobs (project_id, created_at desc);

drop trigger if exists set_render_jobs_updated_at on public.render_jobs;

create trigger set_render_jobs_updated_at
before update on public.render_jobs
for each row
execute function public.handle_updated_at();

alter table public.render_jobs enable row level security;

create policy "Users can manage render jobs for own projects"
on public.render_jobs
for all
to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = render_jobs.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = render_jobs.project_id
      and projects.user_id = auth.uid()
  )
);

create table if not exists public.generated_videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  render_job_id uuid references public.render_jobs (id) on delete set null,
  file_url text,
  thumbnail_url text,
  duration_seconds integer,
  status text not null default 'draft' check (
    status in ('draft', 'ready', 'failed', 'archived')
  ),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists generated_videos_project_id_created_at_idx
  on public.generated_videos (project_id, created_at desc);

drop trigger if exists set_generated_videos_updated_at on public.generated_videos;

create trigger set_generated_videos_updated_at
before update on public.generated_videos
for each row
execute function public.handle_updated_at();

alter table public.generated_videos enable row level security;

create policy "Users can manage generated videos for own projects"
on public.generated_videos
for all
to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = generated_videos.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = generated_videos.project_id
      and projects.user_id = auth.uid()
  )
);
