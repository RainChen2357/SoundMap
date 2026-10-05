# SoundMap

> 默认语言：中文 · [English](#english)

SoundMap 是一张由歌曲、地点和个人记忆组成的音乐地图。你可以在某个地方留下一首歌，发现别人留在附近的音乐，也可以沿着一条 Trail 步行聆听一组歌曲。

## 设计理念

**让音乐和真实地点产生联系。** 一首歌不只是播放列表里的一个条目，也可以成为某段路、一个角落或一次相遇的记忆。

SoundMap 有两种不同的发现方式：

- **Public Music Drop：**「这里有一首歌。」它始终显示在地图上，歌曲封面、歌名和歌手也可以提前查看。距离规则只控制歌曲何时解锁。
- **Hidden Treasure：**「这附近藏着一首歌，但你要自己找到它。」离开 800m 发现范围时完全不显示；进入范围后才出现柔和的模糊区域和线索。地图和面板不会显示精确距离或歌曲信息。走到解锁半径后，歌曲才会揭晓。

整体体验保持安静、克制：地图帮助人们留意周围，线索引导探索，歌曲在合适的时刻出现。Hidden Treasure 被聚类后只显示聚类标记，不再显示单独的隐藏标记。

## 功能介绍

- **Music Drop：** 将歌曲留在地图上的一个地点。Public Drop 始终可见；创建时可设置解锁距离。
- **Hidden Treasure：** 创建时可添加最多 80 个字符的可选线索，选择 20m、50m 或 100m 解锁距离。发现范围固定为 800m。首次解锁后会记录在当前浏览器中，之后再次访问时可以直接看到歌曲标记。
- **Echo：** 用另一首歌回应一个 Music Drop，并可附上一段简短文字。
- **Music Trail：** 创建由多个地点和歌曲组成的步行路线，按顺序到达并解锁各个停靠点。
- **Library：** 查看保存的歌曲、自己的 Drops 和 Trails。
- **Demo Mode：** 无需账号、Supabase 或 GPS，即可体验上海地图上的示例数据。地图底图和试听音频需要网络连接。

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 <http://localhost:3000>。默认使用 Demo Mode；新建的 Drop、保存状态和 Hidden Treasure 发现记录保存在浏览器本地。地图使用 OpenFreeMap 的 OpenStreetMap 底图，不需要 Mapbox token。

## Demo 数据与位置

Demo Mode 包含 30 首示例歌曲、55 个上海地图 Drop（40 个 Public、15 个 Hidden）、20 个示例创建者身份和发现数量。至少 5 个 Hidden Treasure 位于默认 Demo Location 的 800m 范围内，便于体验 clue 与阶段状态。

点击位置按钮后，应用才会请求浏览器定位。也可以使用 **Use Demo Location** 回到上海默认位置。Public Drop 的 **Try nearby in Demo Mode** 按钮可模拟抵达并解锁。

## Supabase 设置

1. 创建 Supabase 项目。
2. 将项目 URL 和 anon key 填入 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`，并将 `NEXT_PUBLIC_DEMO_MODE` 设为 `false`。
3. 在 Supabase SQL Editor 中按顺序执行 `supabase/migrations/` 下的 migration，包含 Hidden Treasure 的 `202610050001_hidden_treasure.sql`。
4. 运行 `node scripts/seed-demo.mjs` 生成 `supabase/seed-demo-generated.sql`，再在 SQL Editor 执行该文件以写入 30 首歌曲和 55 个示例 Drop。`supabase/seed.sql` 提供精简的起始数据。
5. 重启 Next.js。

Supabase 的读取与 Drop 写入逻辑位于 `lib/drops.ts`。发现记录目前保存在本地浏览器；项目尚未接入用户登录与跨设备发现同步。现有数据库策略适用于原型，公开部署前应配置 Supabase Auth 和更严格的访问策略。

## 地图与位置隐私

地图由 MapLibre 渲染 OpenFreeMap 的 OpenStreetMap 底图，并显示地图归属信息。`.env.example` 中保留了未来可用的 `NEXT_PUBLIC_MAPBOX_TOKEN` 配置。应用不会保存用户的移动轨迹；创建的 Drop 会保存歌曲地点。反向地理编码尚未接入，因此新建 Drop 当前使用“Shanghai”作为地点名称。

## 项目结构

- `app/`：Next.js 页面与全局样式
- `components/map/`：MapLibre 地图、地图标记和聚类
- `components/music/`：歌曲详情、试听、Echo 和创建流程
- `components/trails/`：Music Trail 浏览、创建与播放体验
- `components/SoundMapApp.tsx`：地图、筛选、Library 和应用状态
- `lib/geo.ts`：距离计算
- `lib/drops.ts`：Supabase Drop 读写与本地示例数据
- `lib/discoveries.ts`：本地 Hidden Treasure 发现记录
- `lib/mock-data.ts`、`lib/songs.ts`：上海示例数据
- `hooks/useUserLocation.ts`：用户点击后请求浏览器定位
- `supabase/migrations/`：PostgreSQL schema migrations

## 常用命令

- `npm run dev`：启动本地开发服务器
- `npm run build`：构建生产版本
- `npm run start`：启动生产服务器
- `npm run lint`：运行 ESLint

---

<a id="english"></a>

# SoundMap (English)

SoundMap is a music map built from songs, places, and personal memories. Leave a song somewhere, discover music left nearby, or walk through a trail of songs tied to real locations.

## Product philosophy

**Connect music to the places where life happens.** A song can be more than an item in a playlist: it can hold the memory of a street, a quiet corner, or a moment shared with someone.

SoundMap offers two distinct ways to discover music:

- **Public Music Drop:** “There is a song here.” It stays visible on the map, with its cover, title, and artist available before it unlocks. Distance rules control when the song becomes playable.
- **Hidden Treasure:** “There is a song hidden nearby, but you have to find it.” It stays completely out of view beyond its 800 m discovery radius. Once nearby, a soft blurred area and a clue invite exploration. The map and sheet hide the exact distance and song details until the listener enters the unlock radius.

The experience stays quiet and minimal. The map draws attention to the surrounding place, a clue guides the search, and the song appears at the right moment. A clustered Hidden Treasure is represented by the cluster marker without its individual hidden marker.

## Features

- **Music Drop:** Leave a song at a place on the map. Public Drops remain visible; creators can set an unlock distance.
- **Hidden Treasure:** Add an optional clue of up to 80 characters and choose a 20 m, 50 m, or 100 m unlock radius. The discovery radius is fixed at 800 m. First discoveries are saved in the current browser, so the song marker appears on later visits.
- **Echo:** Reply to a Music Drop with another song and an optional short note.
- **Music Trail:** Create a walking route made of places and songs, then reach its stops in order to unlock them.
- **Library:** Browse saved songs, your Drops, and Trails.
- **Demo Mode:** Explore sample data around Shanghai without an account, Supabase, or GPS. Map tiles and audio previews require an internet connection.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Demo Mode is enabled by default. New Drops, saved state, and Hidden Treasure discoveries are stored in the browser. The map uses OpenFreeMap’s OpenStreetMap basemap and does not require a Mapbox token.

## Demo data and location

Demo Mode includes 30 sample songs and 55 Shanghai map Drops (40 Public and 15 Hidden), with 20 sample creator identities and discovery counts. At least five Hidden Treasures are within 800 m of the default Demo Location so their clues and proximity stages are easy to explore.

The location button requests browser location only after it is clicked. Choose **Use Demo Location** to return to the default Shanghai location. Public Drops include **Try nearby in Demo Mode** to simulate arrival and unlocking.

## Supabase setup

1. Create a Supabase project.
2. Add its URL and anon key to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and set `NEXT_PUBLIC_DEMO_MODE=false`.
3. Run the migrations in `supabase/migrations/` in order in the Supabase SQL Editor, including `202610050001_hidden_treasure.sql`.
4. Run `node scripts/seed-demo.mjs` to generate `supabase/seed-demo-generated.sql`, then execute it in the SQL Editor to add 30 songs and 55 sample Drops. `supabase/seed.sql` is a smaller starter seed.
5. Restart Next.js.

Supabase Drop reads and writes live in `lib/drops.ts`. Discovery records currently stay in the local browser; the project does not yet have user authentication or cross-device discovery sync. The included database policies are intended for a prototype. Configure Supabase Auth and tighter access policies before public deployment.

## Map and location privacy

MapLibre renders OpenFreeMap’s OpenStreetMap basemap with attribution. `.env.example` keeps `NEXT_PUBLIC_MAPBOX_TOKEN` as a future provider setting. The app does not store a user’s movement history; it stores the song location attached to each Drop. Reverse geocoding is not connected, so new Drops currently use “Shanghai” as their place label.

## Project structure

- `app/`: Next.js pages and global styles
- `components/map/`: MapLibre map, markers, and clusters
- `components/music/`: song details, previews, Echo, and creation flow
- `components/trails/`: Music Trail browsing, creation, and playback
- `components/SoundMapApp.tsx`: map, filters, Library, and app state
- `lib/geo.ts`: distance calculations
- `lib/drops.ts`: Supabase Drop access and local demo persistence
- `lib/discoveries.ts`: local Hidden Treasure discovery records
- `lib/mock-data.ts`, `lib/songs.ts`: Shanghai sample data
- `hooks/useUserLocation.ts`: click-to-request browser location
- `supabase/migrations/`: PostgreSQL schema migrations

## Commands

- `npm run dev`: start the local development server
- `npm run build`: build the production app
- `npm run start`: start the production server
- `npm run lint`: run ESLint
