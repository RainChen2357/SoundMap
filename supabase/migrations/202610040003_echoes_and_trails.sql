-- Additive only: the prior drop_interactions migration/data remains untouched.
create table if not exists public.echoes (
  id uuid primary key default gen_random_uuid(),
  drop_id text not null references public.music_drops(id) on delete cascade,
  user_id uuid,
  song_id text not null references public.songs(id),
  note text check (char_length(note) <= 50),
  created_at timestamptz not null default now()
);

create table if not exists public.music_trails (
  id uuid primary key default gen_random_uuid(),
  creator_id text,
  title text not null,
  description text,
  cover_url text,
  total_distance integer not null default 0,
  estimated_minutes integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.trail_stops (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.music_trails(id) on delete cascade,
  song_id text not null references public.songs(id),
  stop_order integer not null check (stop_order between 1 and 10),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  place_name text,
  note text check (char_length(note) <= 120),
  unlock_radius integer not null default 50 check (unlock_radius >= 20),
  created_at timestamptz not null default now(),
  unique (trail_id, stop_order)
);

create table if not exists public.trail_progress (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.music_trails(id) on delete cascade,
  user_id uuid not null,
  current_stop integer not null default 1 check (current_stop >= 1),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (trail_id, user_id)
);

create index if not exists trail_stops_trail_order_idx on public.trail_stops(trail_id, stop_order);
create index if not exists trail_progress_user_idx on public.trail_progress(user_id);
create index if not exists echoes_drop_created_idx on public.echoes(drop_id, created_at desc);

alter table public.echoes enable row level security;
alter table public.music_trails enable row level security;
alter table public.trail_stops enable row level security;
alter table public.trail_progress enable row level security;

create policy "echoes readable" on public.echoes for select to anon, authenticated using (true);
create policy "echoes insertable" on public.echoes for insert to anon, authenticated with check (true);
create policy "trails readable" on public.music_trails for select to anon, authenticated using (true);
create policy "trails insertable" on public.music_trails for insert to anon, authenticated with check (true);
create policy "trail stops readable" on public.trail_stops for select to anon, authenticated using (true);
create policy "trail stops insertable" on public.trail_stops for insert to anon, authenticated with check (true);
create policy "trail stops updateable" on public.trail_stops for update to anon, authenticated using (true) with check (true);
create policy "trail progress readable" on public.trail_progress for select to anon, authenticated using (true);
create policy "trail progress insertable" on public.trail_progress for insert to anon, authenticated with check (true);
create policy "trail progress updateable" on public.trail_progress for update to anon, authenticated using (true) with check (true);
