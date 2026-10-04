'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, Music2, Search, X } from 'lucide-react';
import { songs } from '@/lib/songs';
import { getEchoes, leaveEcho } from '@/lib/echoes';
import { loadLike, toggleLike } from '@/lib/likes';
import type { Echo } from '@/types/echo';
import type { MusicDrop } from '@/types/drop';
import type { Song } from '@/types/song';

export default function EchoSection({ drop, onEcho }: { drop: MusicDrop; onEcho?: () => void }) {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Song | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([getEchoes(drop.id), loadLike(drop.id)]).then(([items, like]) => {
      if (!active) return;
      setEchoes(items); setLikeCount(like.count); setLiked(like.liked);
    });
    return () => { active = false; };
  }, [drop.id]);

  const openFlow = () => { setStep(0); setSelected(null); setNote(''); setError(''); setShowFlow(true); };
  const publish = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    try { const echo = await leaveEcho(drop.id, selected, note.trim()); setEchoes(current => [echo, ...current]); setShowFlow(false); onEcho?.(); }
    catch { setError('Could not leave this Echo. Please try again.'); }
    finally { setSaving(false); }
  };
  const filteredSongs = songs.filter(song => `${song.title} ${song.artist} ${song.album || ''}`.toLowerCase().includes(query.toLowerCase()));
  const toggle = async () => { const value = await toggleLike(drop.id); setLikeCount(value.count); setLiked(value.liked); };
  const ago = (date: string) => { const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)); return days === 0 ? 'Today' : `${days}d`; };

  return <>
    <section className="echo-section" aria-label="Echoes">
      <div className="echo-actions">
        <button className={`drop-like ${liked ? 'liked' : ''}`} aria-pressed={liked} onClick={()=>void toggle()}><Heart size={17} fill={liked ? 'currentColor' : 'none'}/><span>Like</span>{likeCount > 0 && <b>{likeCount}</b>}</button>
        <button className="leave-echo" onClick={openFlow}><Music2 size={16}/><span>Leave an Echo</span></button>
      </div>
      <div className="echo-list"><h3>Echoes <span>· {echoes.length}</span></h3>
        {echoes.length ? echoes.map(echo => <article className="echo-row" key={echo.id}><img src={echo.song.coverUrl} alt=""/><div className="echo-song"><strong>{echo.song.title}</strong><span>{echo.song.artist}</span>{echo.note&&<small>“{echo.note}”</small>}</div><time>{ago(echo.createdAt)}</time></article>) : <p className="echo-empty">No Echoes yet.</p>}
      </div>
    </section>

    <AnimatePresence>{showFlow&&<motion.div className="echo-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e=>{if(e.target===e.currentTarget)setShowFlow(false)}}><motion.section className="echo-sheet glass" initial={{y:50,opacity:0}} animate={{y:0,opacity:1}} exit={{y:50,opacity:0}}><header className="echo-header"><button className="icon-button" aria-label="Close" onClick={()=>setShowFlow(false)}><X size={19}/></button><div><strong>Leave an Echo</strong><small>Reply with a song.</small></div><span>{step+1}/3</span></header>
      {step===0&&<div className="echo-body"><div className="echo-search"><Search size={17}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search songs"/></div><div className="echo-song-list">{filteredSongs.map(song=><button key={song.id} className={selected?.id===song.id?'selected':''} onClick={()=>setSelected(song)}><img src={song.coverUrl} alt=""/><span><strong>{song.title}</strong><small>{song.artist}</small></span></button>)}</div></div>}
      {step===1&&<div className="echo-body"><label className="echo-note-label" htmlFor="echo-note">Add a note <span>Optional · {note.length}/50</span></label><textarea id="echo-note" maxLength={50} value={note} onChange={e=>setNote(e.target.value)} placeholder="Why this song?"/></div>}
      {step===2&&selected&&<div className="echo-body echo-preview"><div className="echo-preview-label">ORIGINAL</div><div className="echo-preview-song"><img src={drop.song.coverUrl} alt=""/><span><strong>{drop.song.title}</strong><small>{drop.song.artist}</small></span></div><ArrowRight size={18}/><div className="echo-preview-label">YOUR ECHO</div><div className="echo-preview-song"><img src={selected.coverUrl} alt=""/><span><strong>{selected.title}</strong><small>{selected.artist}</small></span></div>{note&&<p>“{note}”</p>}</div>}
      {error&&<p className="echo-error">{error}</p>}
      <footer className="echo-footer">{step>0&&<button className="echo-back" onClick={()=>setStep(value=>value-1)}><ArrowLeft size={16}/>Back</button>}{step<2?<button className="echo-next" disabled={step===0&&!selected} onClick={()=>setStep(value=>value+1)}>Continue<ArrowRight size={16}/></button>:<button className="echo-next" disabled={saving} onClick={()=>void publish()}>{saving?'Leaving Echo…':'Leave Echo'}</button>}</footer>
    </motion.section></motion.div>}</AnimatePresence>
  </>;
}
