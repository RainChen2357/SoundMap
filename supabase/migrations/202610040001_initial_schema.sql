create extension if not exists pgcrypto;
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(), username text, avatar_url text,
  created_at timestamptz not null default now()
);
create table if not exists public.songs (
  id text primary key, title text not null, artist text not null, album text,
  cover_url text, preview_url text, duration integer, created_at timestamptz not null default now()
);
create table if not exists public.music_drops (
  id text primary key, creator_id text references public.users(id) on delete set null,
  song_id text not null references public.songs(id), latitude double precision not null check(latitude between -90 and 90),
  longitude double precision not null check(longitude between -180 and 180), place_name text, note text check(char_length(note) <= 120),
  visibility text not null check(visibility in ('public','hidden')), discovery_radius integer not null default 1000,
  unlock_radius integer not null default 50 check(unlock_radius >= 20), discovery_count integer not null default 0,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create index if not exists music_drops_bounds_idx on public.music_drops(latitude,longitude) where is_active=true;
create table if not exists public.discoveries (
  id uuid primary key default gen_random_uuid(), drop_id text not null references public.music_drops(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade, discovered_at timestamptz not null default now(),
  reaction text, unique(drop_id,user_id)
);
create table if not exists public.saved_drops (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  drop_id text not null references public.music_drops(id) on delete cascade, created_at timestamptz not null default now(), unique(user_id,drop_id)
);
alter table public.users enable row level security;
alter table public.songs enable row level security;
alter table public.music_drops enable row level security;
alter table public.discoveries enable row level security;
alter table public.saved_drops enable row level security;
-- MVP policy: anon can read catalog/map and insert demo drops. Production should add Supabase Auth policies.
create policy "songs readable" on public.songs for select to anon, authenticated using (true);
create policy "active drops readable" on public.music_drops for select to anon, authenticated using (is_active=true);
create policy "demo drops insertable" on public.music_drops for insert to anon, authenticated with check (true);
