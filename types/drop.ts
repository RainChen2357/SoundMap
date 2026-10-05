import type { Song } from './song';
export type Visibility = 'public' | 'hidden';
export interface MusicDrop { id: string; creatorId: string; song: Song; latitude: number; longitude: number; placeName: string; note: string; clue?: string | null; visibility: Visibility; discoveryRadius: number; unlockRadius: number; discoveryCount: number; isActive: boolean; createdAt: string }
