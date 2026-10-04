import type { Song } from './song';

export type Echo = {
  id: string;
  dropId: string;
  song: Song;
  note: string;
  createdAt: string;
};
