create table if not exists public.feature_pricing (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null unique,
  name text not null,
  description text,
  credit_cost integer not null check (credit_cost >= 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

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
      'export'
    )
  );

drop trigger if exists set_feature_pricing_updated_at on public.feature_pricing;

create trigger set_feature_pricing_updated_at
before update on public.feature_pricing
for each row
execute function public.handle_updated_at();

insert into public.feature_pricing (feature_key, name, description, credit_cost, is_active)
values
  ('text_generation', 'Text generation', 'AI script generation for a project.', 1, true),
  ('scene_generation', 'Scene generation', 'AI scene breakdown generation.', 1, true),
  ('prompt_generation', 'Prompt generation', 'Veo prompt generation or regeneration.', 1, true),
  ('veo_render', 'Veo render', 'Text-to-video render through Veo provider.', 5, true),
  ('image_to_video', 'Image to video', 'Image-to-video render through Veo provider.', 6, true),
  ('transition_video', 'Transition video', 'Start/end image transition render.', 7, true),
  ('export', 'Export', 'FFmpeg final video export.', 3, true)
on conflict (feature_key) do update
set
  name = excluded.name,
  description = excluded.description,
  credit_cost = public.feature_pricing.credit_cost,
  is_active = public.feature_pricing.is_active;

alter table public.feature_pricing enable row level security;

drop policy if exists "Authenticated users can read active feature pricing" on public.feature_pricing;
drop policy if exists "Admins can manage feature pricing" on public.feature_pricing;

create policy "Authenticated users can read active feature pricing"
on public.feature_pricing
for select
to authenticated
using (is_active = true or public.is_admin(auth.uid()));

create policy "Admins can manage feature pricing"
on public.feature_pricing
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
