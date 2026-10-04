import { getSupabase } from './supabase';
import { songs } from './songs';
import { getDistanceMeters } from './geo';
import { getVisitorId } from './visitor';
import type { MusicTrail, TrailProgress, TrailStop } from '@/types/trail';

const TRAILS_KEY = 'soundmap.trails.v1';
const PROGRESS_KEY = 'soundmap.trail-progress.v1';
const demoRoutes: Array<{ title: string; description: string; stops: Array<[number, number, string, number]> }> = [
  { title: 'A Walk After Midnight', description: 'Songs for the quiet streets after the city slows down.', stops: [[31.2304,121.4737,'People’s Square',23],[31.2334,121.4781,'Nanjing Road',4],[31.2371,121.4815,'The Bund',2],[31.241,121.486,'River Walk',7]] },
  { title: 'Campus Morning', description: 'A gentle soundtrack for the first walk across campus.', stops: [[31.298,121.501,'Main Gate',0],[31.3002,121.505,'Old Library',5],[31.3024,121.508,'Campus Lake',11],[31.305,121.511,'North Garden',1]] },
  { title: 'Songs by the River', description: 'Follow the water and let each stop bring a new song.', stops: [[31.239,121.49,'Riverside Steps',9],[31.241,121.494,'Old Pier',21],[31.243,121.498,'Willow Path',14],[31.245,121.502,'River Lookout',26]] },
];

function buildDemo(): MusicTrail[] {
  return demoRoutes.map((route, routeIndex) => {
    const stops: TrailStop[] = route.stops.map(([latitude, longitude, placeName, songIndex], index) => ({
      id: `demo-trail-${routeIndex + 1}-stop-${index + 1}`, trailId: `demo-trail-${routeIndex + 1}`,
      song: songs[songIndex], stopOrder: index + 1, latitude, longitude, placeName, note: '', unlockRadius: 60,
    }));
    const totalDistance = stops.slice(1).reduce((sum, stop, index) => sum + getDistanceMeters(stops[index].latitude, stops[index].longitude, stop.latitude, stop.longitude), 0);
    return { id: `demo-trail-${routeIndex + 1}`, creatorId: 'demo', title: route.title, description: route.description, coverUrl: stops[0].song.coverUrl, totalDistance: Math.round(totalDistance), estimatedMinutes: Math.max(1, Math.round(totalDistance / 80)), isPublic: true, createdAt: new Date().toISOString(), stops };
  });
}

function readLocalTrails(): MusicTrail[] { try { return JSON.parse(localStorage.getItem(TRAILS_KEY) || '[]') as MusicTrail[]; } catch { return []; } }
function readLocalProgress(): Record<string, TrailProgress> { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') as Record<string, TrailProgress>; } catch { return {}; } }

export async function fetchTrails(): Promise<MusicTrail[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('music_trails').select('*, trail_stops(*, songs(*))').eq('is_public', true).order('created_at', { ascending: false });
    if (!error && data) {
      const remote = data.map(row => ({ ...row, stops: (row.trail_stops || []).flatMap((stop: Record<string, unknown>) => {
        const songRow = stop.songs as { id: string; title: string; artist: string; album?: string; cover_url?: string; preview_url?: string; duration?: number } | null;
        if (!songRow) return [];
        return [{ id: stop.id as string, trailId: stop.trail_id as string, song: { id: songRow.id, title: songRow.title, artist: songRow.artist, album: songRow.album, coverUrl: songRow.cover_url || '', previewUrl: songRow.preview_url || '', duration: songRow.duration }, stopOrder: stop.stop_order as number, latitude: stop.latitude as number, longitude: stop.longitude as number, placeName: stop.place_name as string || '', note: stop.note as string || '', unlockRadius: stop.unlock_radius as number }]; }), id: row.id, creatorId: row.creator_id || '', title: row.title, description: row.description || '', coverUrl: row.cover_url || '', totalDistance: row.total_distance || 0, estimatedMinutes: row.estimated_minutes || 0, isPublic: row.is_public, createdAt: row.created_at } as MusicTrail));
      return [...readLocalTrails(), ...remote, ...buildDemo()];
    }
  }
  return [...readLocalTrails(), ...buildDemo()];
}

export async function publishTrail(trail: MusicTrail): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('music_trails').insert({ id: trail.id, creator_id: trail.creatorId, title: trail.title, description: trail.description, cover_url: trail.coverUrl, total_distance: trail.totalDistance, estimated_minutes: trail.estimatedMinutes, is_public: trail.isPublic });
    if (!error) {
      const { error: stopError } = await supabase.from('trail_stops').insert(trail.stops.map(stop => ({ id: stop.id, trail_id: trail.id, song_id: stop.song.id, stop_order: stop.stopOrder, latitude: stop.latitude, longitude: stop.longitude, place_name: stop.placeName, note: stop.note, unlock_radius: stop.unlockRadius })));
      if (!stopError) return;
    }
  }
  localStorage.setItem(TRAILS_KEY, JSON.stringify([trail, ...readLocalTrails().filter(item => item.id !== trail.id)]));
}

export async function getTrailProgress(trailId: string): Promise<TrailProgress | null> {
  const visitorId = getVisitorId();
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('trail_progress').select('*').eq('trail_id', trailId).eq('user_id', visitorId).maybeSingle();
    if (!error && data) return { trailId, currentStop: data.current_stop, completed: Boolean(data.completed_at), startedAt: data.started_at, completedAt: data.completed_at };
  }
  return readLocalProgress()[trailId] || null;
}

export async function saveTrailProgress(progress: TrailProgress): Promise<void> {
  const visitorId = getVisitorId();
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.from('trail_progress').select('id').eq('trail_id', progress.trailId).eq('user_id', visitorId).maybeSingle();
    const row = { trail_id: progress.trailId, user_id: visitorId, current_stop: progress.currentStop, started_at: progress.startedAt, completed_at: progress.completedAt };
    const result = data ? await supabase.from('trail_progress').update(row).eq('id', data.id) : await supabase.from('trail_progress').insert(row);
    if (!result.error) return;
  }
  const all = readLocalProgress();
  all[progress.trailId] = progress;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}
