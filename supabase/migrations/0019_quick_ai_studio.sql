alter table public.project_assets
  drop constraint if exists project_assets_asset_type_check;

alter table public.project_assets
  add column if not exists type text,
  add column if not exists prompt text,
  add column if not exists model text,
  add column if not exists output_url text,
  add column if not exists status text not null default 'completed';

update public.project_assets
set type = case
  when mime_type like 'video/%' then 'video'
  else 'image'
end
where type is null;

alter table public.project_assets
  alter column type set not null;

alter table public.project_assets
  add constraint project_assets_type_check
  check (type in ('image', 'video', 'audio', 'file'));

alter table public.project_assets
  add constraint project_assets_status_check
  check (status in ('queued', 'processing', 'completed', 'failed'));

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
      'voiceover_audio',
      'music_audio',
      'audio',
      'generated_image',
      'generated_video'
    )
  );

create table if not exists public.quick_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  prompt text not null,
  model text not null,
  output_url text,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  aspect_ratio text,
  duration_seconds integer,
  quantity integer not null default 1,
  reference_file_name text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists quick_generations_user_type_created_at_idx
  on public.quick_generations (user_id, type, created_at desc);

drop trigger if exists set_quick_generations_updated_at on public.quick_generations;

create trigger set_quick_generations_updated_at
before update on public.quick_generations
for each row
execute function public.handle_updated_at();

alter table public.quick_generations enable row level security;

drop policy if exists "Users can manage own quick generations" on public.quick_generations;

create policy "Users can manage own quick generations"
on public.quick_generations
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.feature_pricing
  drop constraint if exists feature_pricing_feature_key_check;

alter table public.feature_pricing
  add constraint feature_pricing_feature_key_check
  check (
    feature_key in (
      'text_generation',
      'scene_generation',
      'prompt_generation',
      'veo_render',
      'image_to_video',
      'transition_video',
      'export',
      'image_generation',
      'video_generation'
    )
  );

insert into public.feature_pricing (feature_key, name, description, credit_cost, is_active)
values
  ('image_generation', 'Image generation', 'Quick or project image generation through the AI gateway.', 2, true),
  ('video_generation', 'Video generation', 'Quick or project video generation through the AI gateway.', 5, true)
on conflict (feature_key) do update
set
  name = excluded.name,
  description = excluded.description,
  credit_cost = public.feature_pricing.credit_cost,
  is_active = public.feature_pricing.is_active;
