import type { Coordinates } from '@/lib/geo';
import type { Song } from './song';

export type TrailStop = Coordinates & {
  id: string;
  trailId: string;
  song: Song;
  stopOrder: number;
  placeName: string;
  note: string;
  unlockRadius: number;
};

export type MusicTrail = {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  coverUrl: string;
  totalDistance: number;
  estimatedMinutes: number;
  isPublic: boolean;
  createdAt: string;
  stops: TrailStop[];
};

export type TrailProgress = {
  trailId: string;
  currentStop: number;
  completed: boolean;
  startedAt: string;
  completedAt: string | null;
};
