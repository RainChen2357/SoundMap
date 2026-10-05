'use client';
import { ArrowLeft, Check, MapPin, Plus, Search, X } from 'lucide-react';
import { AnimatePresence,motion } from 'framer-motion';
import type { Coordinates } from '@/lib/geo';
import type { Visibility } from '@/types/drop';
import type { Song } from '@/types/song';
import dynamic from 'next/dynamic';

const PositionPicker=dynamic(()=>import('@/components/map/PositionPicker'),{ssr:false,loading:()=> <div className="position-picker picker-loading"/>});

export default function CreateDropFlow({open,step,setStep,place,setPlace,song,setSong,note,setNote,clue,setClue,visibility,setVisibility,radius,setRadius,songQuery,setSongQuery,filteredSongs,darkMode,onClose,onSubmit}: {
  open:boolean; step:number; setStep:(step:number)=>void; place:Coordinates; setPlace:(point:Coordinates)=>void; song:Song|null; setSong:(song:Song)=>void;
  note:string; setNote:(value:string)=>void; clue:string; setClue:(value:string)=>void; visibility:Visibility; setVisibility:(value:Visibility)=>void;
  radius:number; setRadius:(value:number)=>void; songQuery:string; setSongQuery:(value:string)=>void; filteredSongs:Song[]; darkMode?:boolean; onClose:()=>void; onSubmit:()=>void;
}) {
  const hidden=visibility==='hidden';
  return <AnimatePresence>{open&&<motion.div className="create-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><section className="create-panel glass">
    <header className="create-header"><button aria-label="Close create flow" className="icon-button" onClick={onClose}><X size={20}/></button><div><span>STEP {step+1} OF 5</span><div className="progress-line"><i style={{width:`${(step+1)*20}%`}}/></div></div><span className="step-number">{step+1}/5</span></header>
    <div className="create-body">
      {step===0&&<><h1>Leave a song</h1><p className="create-subtitle">Choose where this song will live.</p><div className="pin-map"><PositionPicker value={place} onChange={setPlace} darkMode={darkMode}/><span className="map-place"><MapPin size={15}/><span><strong>Shanghai</strong><small>{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</small></span></span><span className="map-instruction">Move the map to place your pin</span></div></>}
      {step===1&&<><h1>Choose a song</h1><p className="create-subtitle">A song for this place.</p><div className="song-search"><Search size={18}/><input autoFocus placeholder="Search songs" value={songQuery} onChange={e=>setSongQuery(e.target.value)}/></div><div className="song-list">{filteredSongs.map(item=><button key={item.id} className={song?.id===item.id?'chosen':''} onClick={()=>setSong(item)}><img src={item.coverUrl} alt=""/><span><strong>{item.title}</strong><small>{item.artist}</small></span>{song?.id===item.id&&<Check size={18}/>}</button>)}</div></>}
      {step===2&&<><h1>Add a note</h1><p className="create-subtitle">A few words for whoever finds it.</p><textarea maxLength={120} value={note} onChange={e=>setNote(e.target.value)} placeholder="Why does this song belong here?"/><div className="char-count">{note.length} / 120</div></>}
      {step===3&&<><h1>Who can find it?</h1><p className="create-subtitle">Choose how your song appears on the map.</p><div className="choice-list"><button className={visibility==='public'?'chosen':''} onClick={()=>setVisibility('public')}><span className="choice-icon"><MapPin size={19}/></span><span><strong>Public</strong><small>Visible to anyone exploring the map.</small></span>{!hidden&&<Check size={18}/>}</button><button className={hidden?'chosen':''} onClick={()=>{setVisibility('hidden');if(radius===300)setRadius(50)}}><span className="choice-icon hidden-choice"><span>?</span></span><span><strong>Hidden Treasure</strong><small>A nearby hint leads to the song.</small></span>{hidden&&<Check size={18}/>}</button></div></>}
      {step===4&&hidden&&<><h1>Hide a song</h1><p className="create-subtitle">Leave a clue for someone to follow.</p><textarea className="clue-input" maxLength={80} value={clue} onChange={e=>setClue(e.target.value)} placeholder="Give people a hint.\nNear the place where you can hear the fountain."/><div className="char-count">{clue.length} / 80</div><h2 className="preview-title">Unlock distance</h2><div className="radius-options">{[20,50,100].map(n=><button key={n} className={radius===n?'chosen':''} onClick={()=>setRadius(n)}>{n}<small>m</small></button>)}</div><div className="treasure-create-note">Discovery radius is 800 m.</div></>}
      {step===4&&!hidden&&<><h1>Set the distance</h1><p className="create-subtitle">How close should someone get?</p><div className="radius-options">{[20,50,100,300].map(n=><button key={n} className={radius===n?'chosen':''} onClick={()=>setRadius(n)}>{n}<small>m</small></button>)}</div><h2 className="preview-title">A little preview</h2><div className="preview-row"><img src={song?.coverUrl} alt=""/><div><strong>{song?.title}</strong><small>{song?.artist}</small><small><MapPin size={13}/> Shanghai · unlock at {radius} m</small></div><span className="visibility-tag">PUBLIC</span></div></>}
    </div>
    <footer className="create-footer">{step>0&&<button className="back-button" onClick={()=>setStep(step-1)}><ArrowLeft size={17}/>Back</button>}<button className="primary-button" disabled={(step===1&&!song)||(step===4&&!song)} onClick={()=>step===4?onSubmit():setStep(step+1)}>{step===4?'Leave Song Here':step===0?'Continue':step===1?'Choose this song':'Continue'}{step===4&&<Plus size={17}/>}</button></footer>
  </section></motion.div>}</AnimatePresence>;
}
