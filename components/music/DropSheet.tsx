'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Check, MapPin, X } from 'lucide-react';
import type { MusicDrop } from '@/types/drop';
import AudioPlayer from './AudioPlayer';
import EchoSection from './EchoSection';

export default function DropSheet({active,unlocked,distance,status,saved,playing,isAudioPlaying,audioProgress,audioDuration,onClose,onDemoArrive,onToggleAudio,onSeek,onToggleSave,onEcho}: {
  active: MusicDrop|null; unlocked: boolean; distance: number; status: string; saved: string[]; playing: MusicDrop|null;
  isAudioPlaying: boolean; audioProgress: number; audioDuration: number; onClose:()=>void; onDemoArrive:(drop:MusicDrop)=>void;
  onToggleAudio:(drop:MusicDrop)=>void; onSeek:(seconds:number)=>void; onToggleSave:(drop:MusicDrop)=>void; onEcho:()=>void;
}) {
  return <AnimatePresence>{active&&<motion.section className="drop-sheet glass" initial={{x:'-50%',y:'100%',opacity:0}} animate={{x:'-50%',y:0,opacity:1}} exit={{x:'-50%',y:'100%',opacity:0}} transition={{type:'spring',damping:28,stiffness:260}}>
    <div className="sheet-grabber"/><button className="sheet-close icon-button" aria-label="Close" onClick={onClose}><X size={20}/></button>
    {active.visibility==='hidden'&&!unlocked?<div className="drop-content treasure-sheet-copy">
      <span className="eyebrow">HIDDEN TREASURE</span><h1>Hidden Song</h1><p>Someone left something nearby.</p>
      {active.clue&&<div className="treasure-clue"><span>CLUE</span><blockquote>“{active.clue}”</blockquote></div>}
      <div className="treasure-status"><span className="treasure-status-dot"/><span>{status}</span></div>
    </div>:<div className="drop-content">
      <div className="drop-heading">
        <motion.div className="album-frame" initial={active.visibility==='hidden'?{opacity:0,scale:.97}:false} animate={{opacity:1,scale:1}} transition={{duration:.4,ease:'easeOut'}}><img src={active.song.coverUrl} alt="Album artwork"/></motion.div>
        <div><div className="eyebrow">{active.visibility==='hidden'?'HIDDEN SONG':'LEFT HERE'}</div><h1>{active.song.title}</h1><p>{active.song.artist}</p></div>
      </div>
      {active.visibility==='public'&&<div className="drop-meta"><span><MapPin size={15}/>{active.placeName}</span><span>{Math.round(distance)} m away</span></div>}
      {unlocked?<><div className="found-label"><span className="found-icon"><Check size={17}/></span>You found it.</div>
        <AudioPlayer song={active.song} isPlaying={playing?.song.id===active.song.id&&isAudioPlaying} progress={playing?.song.id===active.song.id?audioProgress:0} duration={playing?.song.id===active.song.id?audioDuration:0} onToggle={()=>onToggleAudio(active)} onSeek={onSeek}/>
        {active.note&&<blockquote>“{active.note}”</blockquote>}
        <EchoSection drop={active} onEcho={onEcho}/>
        <div className="left-by">Left here {Math.max(1,Math.floor((Date.now()-new Date(active.createdAt).getTime())/86400000))} days ago <span>·</span> {active.discoveryCount} discoveries</div>
        <button className={`save-action ${saved.includes(active.id)?'saved':''}`} onClick={()=>onToggleSave(active)}><Bookmark size={18} fill={saved.includes(active.id)?'currentColor':'none'}/>{saved.includes(active.id)?'Saved to Library':'Save'}</button>
      </>:<><div className="locked-message"><span className="lock-symbol">⌑</span><div><strong>Walk closer to unlock</strong><small>This song unlocks when you arrive.</small></div></div>
        <button className="demo-arrive" onClick={()=>onDemoArrive(active)}>Try nearby in Demo Mode <span>→</span></button>
      </>}
    </div>}
  </motion.section>}</AnimatePresence>;
}
