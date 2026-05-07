alter table public.render_jobs
  drop constraint if exists render_jobs_render_mode_check;

alter table public.render_jobs
  add column if not exists source_asset_id uuid references public.project_assets (id) on delete set null,
  add column if not exists motion_style text;

alter table public.render_jobs
  add constraint render_jobs_render_mode_check
  check (render_mode in ('text_to_video', 'image_to_video'));

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
      'luxury_ad'
    )
  );

create index if not exists render_jobs_source_asset_id_idx
  on public.render_jobs (source_asset_id);
