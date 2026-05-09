update public.feature_pricing
set credit_cost = 0
where feature_key in (
  'text_generation',
  'scene_generation',
  'prompt_generation',
  'export',
  'image_generation',
  'video_generation'
);

insert into public.feature_pricing (feature_key, name, description, credit_cost, is_active)
values
  ('veo_render', 'Veo render', 'Text-to-video render through Veo provider.', 5, true),
  ('image_to_video', 'Image to video', 'Image-to-video render through Veo provider.', 6, true),
  ('transition_video', 'Transition video', 'Start/end image transition render.', 7, true)
on conflict (feature_key) do update
set
  name = excluded.name,
  description = excluded.description,
  credit_cost = excluded.credit_cost,
  is_active = true,
  updated_at = timezone('utc'::text, now());
