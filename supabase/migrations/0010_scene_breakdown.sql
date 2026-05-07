alter table public.scenes
  add column if not exists visual_description text,
  add column if not exists camera_angle text,
  add column if not exists camera_movement text,
  add column if not exists subject_action text,
  add column if not exists background text,
  add column if not exists lighting text,
  add column if not exists on_screen_text text,
  add column if not exists notes text;
