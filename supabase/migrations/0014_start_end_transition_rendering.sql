alter table public.render_jobs
  drop constraint if exists render_jobs_render_mode_check;

alter table public.render_jobs
  add column if not exists end_asset_id uuid references public.project_assets (id) on delete set null;

alter table public.render_jobs
  add constraint render_jobs_render_mode_check
  check (render_mode in ('text_to_video', 'image_to_video', 'start_end_transition'));

alter table public.render_jobs
  drop constraint if exists render_jobs_motion_style_check;

alter table public.render_jobs
  add constraint render_jobs_motion_style_check
  check (
    motion_style is null
    or motion_style in (
      'cinematic_zoom',
      'orbit',
      'product_reveal',
      'parallax',
      'handheld',
      'luxury_ad',
      'cinematic_morph',
      'speed_ramp',
      'three_d_orbit',
      'product_transformation',
      'before_after',
      'light_sweep'
    )
  );

create index if not exists render_jobs_end_asset_id_idx
  on public.render_jobs (end_asset_id);
