const STORAGE_KEY = 'soundmap.discoveries.v1';

export function getDiscoveredDropIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[]; }
  catch { return []; }
}

export function recordDiscoveredDrop(id: string): string[] {
  const next = [...new Set([...getDiscoveredDropIds(), id])];
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
