create table if not exists public.drop_resonances (
  id uuid primary key default gen_random_uuid(),
  drop_id text not null references public.music_drops(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique (drop_id, visitor_id)
);

create table if not exists public.drop_comments (
  id uuid primary key default gen_random_uuid(),
  drop_id text not null references public.music_drops(id) on delete cascade,
  visitor_id text not null,
  content text not null check (char_length(content) between 1 and 280),
  created_at timestamptz not null default now()
);

create index if not exists drop_resonances_drop_id_idx on public.drop_resonances(drop_id);
create index if not exists drop_comments_drop_created_idx on public.drop_comments(drop_id, created_at desc);

alter table public.drop_resonances enable row level security;
alter table public.drop_comments enable row level security;

create policy "drop resonances readable" on public.drop_resonances for select to anon, authenticated using (true);
create policy "drop resonances insertable" on public.drop_resonances for insert to anon, authenticated with check (true);
create policy "drop resonances removable" on public.drop_resonances for delete to anon, authenticated using (true);
create policy "drop comments readable" on public.drop_comments for select to anon, authenticated using (true);
create policy "drop comments insertable" on public.drop_comments for insert to anon, authenticated with check (true);
