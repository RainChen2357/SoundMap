import { getSupabase } from './supabase';
import { getVisitorId } from './visitor';

const STORAGE_KEY = 'soundmap.likes.v1';
type Likes = Record<string, string[]>;
function readLocal(): Likes { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Likes; } catch { return {}; } }

export async function loadLike(dropId: string): Promise<{ count: number; liked: boolean }> {
  const visitorId = getVisitorId();
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('drop_resonances').select('visitor_id').eq('drop_id', dropId);
    if (!error && data) return { count: data.length, liked: data.some(item => item.visitor_id === visitorId) };
  }
  const ids = readLocal()[dropId] || [];
  return { count: ids.length, liked: ids.includes(visitorId) };
}

export async function toggleLike(dropId: string): Promise<{ count: number; liked: boolean }> {
  const visitorId = getVisitorId();
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('drop_resonances').select('visitor_id').eq('drop_id', dropId);
    if (!error && data) {
      const liked = data.some(item => item.visitor_id === visitorId);
      const result = liked
        ? await supabase.from('drop_resonances').delete().eq('drop_id', dropId).eq('visitor_id', visitorId)
        : await supabase.from('drop_resonances').insert({ drop_id: dropId, visitor_id: visitorId });
      if (!result.error) return { count: data.length + (liked ? -1 : 1), liked: !liked };
    }
  }
  const all = readLocal();
  const ids = all[dropId] || [];
  const liked = ids.includes(visitorId);
  all[dropId] = liked ? ids.filter(id => id !== visitorId) : [...ids, visitorId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return { count: all[dropId].length, liked: !liked };
}
