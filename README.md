# SoundMap

> Leave a song somewhere in the world. / 把一首歌，留在一个地方。

SoundMap is a place based music discovery MVP. Explore a quiet Shanghai map, get close to a song someone left behind, listen to a preview, save it, or leave a song of your own. Demo Mode works without accounts, Mapbox, Supabase, or GPS.

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS, MapLibre GL with the no-key OpenFreeMap Positron vector style (OpenStreetMap data), Framer Motion, Lucide, and optional Supabase PostgreSQL.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The app starts with Shanghai demo drops and localStorage-backed new drops and saves. An OSM map is used by default, so a Mapbox token is not required. Map tiles and audio previews need an internet connection.

## Demo mode and location

`NEXT_PUBLIC_DEMO_MODE=true` is the default. Demo drops include 30 sample songs, 40 public drops, 15 hidden drops, 20 creator identities, and anonymous discovery counts. Select any locked drop and use **Try nearby in Demo Mode** to simulate arriving; this makes the full unlock, audio, note, and save flow easy to show without GPS. The location button requests browser location only after a user clicks it. If permission is denied, choose **Use Demo Location**.

## Supabase setup

1. Create a Supabase project.
2. Copy its project URL and anon key to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and set `NEXT_PUBLIC_DEMO_MODE=false` to enable Supabase reads and writes.
3. Run `supabase/migrations/202610040001_initial_schema.sql` in the SQL Editor.
4. Run `node scripts/seed-demo.mjs` to generate `supabase/seed-demo-generated.sql`, then execute that SQL in Supabase. The seed adds 30 songs and 55 Shanghai drops. (The compact `supabase/seed.sql` is a small starter seed.)
5. Restart Next.js.

Supabase reads and drop inserts live in `lib/drops.ts`. If configuration is missing or a request fails, the app falls back to local Demo Mode. The included database read/insert policies are for a prototype; configure Supabase Auth and tighter creator policies before public deployment.

## Map, privacy, and GPS

MapLibre renders OpenFreeMap’s Positron style using OpenStreetMap data; it needs no API key and includes map attribution. `.env.example` also includes `NEXT_PUBLIC_MAPBOX_TOKEN` as a future provider setting. The prototype stores only the selected song location and never displays a user's movement history. Reverse geocoding is not connected yet: created drops use the general label “Shanghai” rather than a street address. Browser GPS accuracy is surfaced for the unlock experience.

## Project structure

- `app/`: Next app and global styling
- `components/map/`: MapLibre map and music markers
- `components/SoundMapApp.tsx`: map, drop sheet, create flow, Library
- `components/music/`: minimal HTML Audio preview controls
- `lib/geo.ts`: Haversine distance and display formatting
- `lib/drops.ts`: Supabase access and local demo persistence
- `lib/mock-data.ts`, `lib/songs.ts`: deterministic Shanghai seed data
- `hooks/useUserLocation.ts`: click-to-request browser location
- `supabase/migrations/`: PostgreSQL schema

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint
