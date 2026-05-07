alter table public.scripts
  add column if not exists title text,
  add column if not exists idea text,
  add column if not exists product_type text,
  add column if not exists target_audience text,
  add column if not exists voiceover text,
  add column if not exists generation_input jsonb not null default '{}'::jsonb,
  add column if not exists generated_output jsonb not null default '{}'::jsonb,
  add column if not exists provider text,
  add column if not exists model text;
