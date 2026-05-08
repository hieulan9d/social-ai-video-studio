alter table public.quick_generations
  drop constraint if exists quick_generations_type_check;

alter table public.quick_generations
  add constraint quick_generations_type_check
  check (type in ('image', 'video', 'prompt'));
