import { getSupabase } from './supabase';
import { findSong } from './songs';
import type { Echo } from '@/types/echo';
import type { Song } from '@/types/song';
import { getVisitorId } from './visitor';

const STORAGE_KEY = 'soundmap.echoes.v1';

export async function getEchoes(dropId: string): Promise<Echo[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('echoes').select('id,drop_id,song_id,note,created_at,songs(*)').eq('drop_id', dropId).order('created_at', { ascending: false });
    if (!error && data) return data.flatMap(row => {
      const joinedValue = row.songs as unknown as { id: string; title: string; artist: string; album?: string; cover_url?: string; preview_url?: string; duration?: number } | Array<{ id: string; title: string; artist: string; album?: string; cover_url?: string; preview_url?: string; duration?: number }> | null;
      const joined = Array.isArray(joinedValue) ? joinedValue[0] : joinedValue;
      const song: Song | undefined = joined ? { id: joined.id, title: joined.title, artist: joined.artist, album: joined.album, coverUrl: joined.cover_url || '', previewUrl: joined.preview_url || '', duration: joined.duration } : findSong(row.song_id);
      return song ? [{ id: row.id, dropId: row.drop_id, song, note: row.note || '', createdAt: row.created_at }] : [];
    });
  }
  try { return (JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Echo[]).filter(echo => echo.dropId === dropId); }
  catch { return []; }
}

export async function leaveEcho(dropId: string, song: Song, note: string): Promise<Echo> {
  const supabase = getSupabase();
  const visitorId = getVisitorId();
  if (supabase) {
    const { data, error } = await supabase.from('echoes').insert({ drop_id: dropId, user_id: visitorId, song_id: song.id, note: note.slice(0, 50) }).select('id,created_at').single();
    if (!error && data) return { id: data.id, dropId, song, note: note.slice(0, 50), createdAt: data.created_at };
  }
  const echo: Echo = { id: crypto.randomUUID(), dropId, song, note: note.slice(0, 50), createdAt: new Date().toISOString() };
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Echo[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([echo, ...all]));
  } catch { localStorage.setItem(STORAGE_KEY, JSON.stringify([echo])); }
  return echo;
}
