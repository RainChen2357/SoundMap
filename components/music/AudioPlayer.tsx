'use client';
import { Pause, Play } from 'lucide-react';
import type { Song } from '@/types/song';

type Props = {
  song: Song;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
};

const time = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;

export default function AudioPlayer({ song, isPlaying, progress, duration, onToggle, onSeek }: Props) {
  return <div className="audio-player">
    <button aria-label={isPlaying ? 'Pause' : 'Play'} className="play-button" onClick={e => { e.stopPropagation(); onToggle(); }}>
      {isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}
    </button>
    <div className="track-wrap">
      <input aria-label={`Track progress for ${song.title}`} type="range" min={0} max={duration || 1} value={progress} onChange={e => onSeek(Number(e.target.value))}/>
      <div className="track-times"><span>{time(progress)}</span><span>{duration ? time(duration) : '0:00'}</span></div>
    </div>
  </div>;
}
