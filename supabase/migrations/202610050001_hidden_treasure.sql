alter table public.music_drops
  add column if not exists clue text check (clue is null or char_length(clue) <= 80);

alter table public.music_drops
  alter column discovery_radius set default 800;

update public.music_drops
set discovery_radius = 800
where visibility = 'hidden';
