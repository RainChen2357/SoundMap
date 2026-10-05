'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bookmark, Check, Clock3, Heart, MapPin, Music2, Plus, Search, X } from 'lucide-react';
import { getDistanceMeters, type Coordinates } from '@/lib/geo';
import { fetchTrails, getTrailProgress, publishTrail, saveTrailProgress } from '@/lib/trails';
import { songs } from '@/lib/songs';
import type { MusicTrail, TrailProgress, TrailStop } from '@/types/trail';
import type { Song } from '@/types/song';
import AudioPlayer from '@/components/music/AudioPlayer';

type Mode = 'closed' | 'explore' | 'detail' | 'create';
type CreateStep = 'info' | 'stops' | 'preview';
const emptyProgress = (trailId: string): TrailProgress => ({ trailId, currentStop: 1, completed: false, startedAt: new Date().toISOString(), completedAt: null });
const PositionPicker = dynamic(() => import('@/components/map/PositionPicker'), { ssr: false, loading: () => <div className="position-picker picker-loading"/> });

export default function TrailExperience({ location, accuracy, createRequested, onCreateRequestConsumed, onTrailStateChange, onToggleSong, currentTrackId, isPlaying, progress, duration, onSeek, finishedSongId, onDemoLocation, onSaveSong, requestedStopId, onStopRequestConsumed, libraryMode = false, showExplore = true, onOpenFromLibrary }: {
  location: Coordinates | null; accuracy: number; createRequested: boolean; onCreateRequestConsumed: () => void;
  onTrailStateChange: (trail: MusicTrail | null, progress: TrailProgress | null) => void;
  onToggleSong: (song: Song) => void; currentTrackId: string | null; isPlaying: boolean; progress: number; duration: number; onSeek: (seconds: number) => void; finishedSongId: string | null;
  onDemoLocation: (point: Coordinates) => void; onSaveSong: (song: Song) => void;
  requestedStopId: string | null; onStopRequestConsumed: () => void; libraryMode?: boolean; showExplore?: boolean; onOpenFromLibrary?: () => void;
}) {
  const [trails, setTrails] = useState<MusicTrail[]>([]);
  const [mode, setMode] = useState<Mode>('closed');
  const [selectedTrail, setSelectedTrail] = useState<MusicTrail | null>(null);
  const [activeTrailId, setActiveTrailId] = useState<string | null>(null);
  const [trailProgress, setTrailProgress] = useState<TrailProgress | null>(null);
  const [selectedStop, setSelectedStop] = useState<TrailStop | null>(null);
  const [busy, setBusy] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>('info');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [builderPoint, setBuilderPoint] = useState<Coordinates>(location || { latitude: 31.2304, longitude: 121.4737 });
  const [placeName, setPlaceName] = useState('Shanghai');
  const [stopNote, setStopNote] = useState('');
  const [unlockRadius, setUnlockRadius] = useState(50);
  const [songQuery, setSongQuery] = useState('');
  const [stopSong, setStopSong] = useState<Song | null>(null);
  const [stops, setStops] = useState<TrailStop[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [localLiked, setLocalLiked] = useState<string[]>([]);
  const [libraryTab, setLibraryTab] = useState<'my'|'started'|'completed'>('my');
  const [libraryProgress, setLibraryProgress] = useState<Record<string, TrailProgress | null>>({});

  useEffect(() => { void fetchTrails().then(setTrails); }, []);
  useEffect(() => { if (!libraryMode || !trails.length) return; void Promise.all(trails.map(async trail => [trail.id, await getTrailProgress(trail.id)] as const)).then(rows => setLibraryProgress(Object.fromEntries(rows))); }, [libraryMode, trails]);
  useEffect(() => { if (createRequested) { setMode('create'); setSelectedTrail(null); setSelectedStop(null); setActiveTrailId(null); onTrailStateChange(null, null); setCreateStep('info'); setTitle(''); setDescription(''); setStops([]); setStopSong(null); setError(''); onCreateRequestConsumed(); } }, [createRequested, onCreateRequestConsumed, onTrailStateChange]);
  useEffect(() => { if (!requestedStopId || !selectedTrail) return; const stop = selectedTrail.stops.find(item => item.id === requestedStopId); if (stop) { setSelectedStop(stop); setMode('detail'); } onStopRequestConsumed(); }, [requestedStopId, selectedTrail, onStopRequestConsumed]);
  useEffect(() => { if (location && createStep === 'info') setBuilderPoint(location); }, [location, createStep]);

  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.stopOrder - b.stopOrder), [stops]);
  const totalDistance = useMemo(() => sortedStops.slice(1).reduce((sum, stop, index) => sum + getDistanceMeters(sortedStops[index].latitude, sortedStops[index].longitude, stop.latitude, stop.longitude), 0), [sortedStops]);
  const songResults = songs.filter(song => `${song.title} ${song.artist} ${song.album || ''}`.toLowerCase().includes(songQuery.toLowerCase()));
  const currentStop = selectedTrail?.stops.find(stop => stop.stopOrder === trailProgress?.currentStop) || null;
  const currentDistance = currentStop && location ? getDistanceMeters(location.latitude, location.longitude, currentStop.latitude, currentStop.longitude) : Infinity;
  const selectedDistance = selectedStop && location ? getDistanceMeters(location.latitude, location.longitude, selectedStop.latitude, selectedStop.longitude) : Infinity;
  const canUnlock = Boolean(currentStop && currentDistance <= currentStop.unlockRadius && accuracy <= 100);

  const chooseTrail = async (trail: MusicTrail) => {
    if (activeTrailId !== trail.id) setActiveTrailId(null);
    setSelectedTrail(trail); setSelectedStop(null); setMode('detail'); setBusy(true);
    const saved = await getTrailProgress(trail.id);
    setTrailProgress(saved); onTrailStateChange(trail, saved); setBusy(false);
  };
  const startTrail = async () => {
    if (!selectedTrail) return;
    const saved = trailProgress || emptyProgress(selectedTrail.id);
    setBusy(true); await saveTrailProgress(saved); setTrailProgress(saved); onTrailStateChange(selectedTrail, saved); setBusy(false);
  };
  const goOnTrail = async () => {
    if (!selectedTrail) return;
    const progress = trailProgress || emptyProgress(selectedTrail.id);
    if (!trailProgress) { setBusy(true); await saveTrailProgress(progress); setTrailProgress(progress); setBusy(false); }
    const activeTrail = { ...selectedTrail, stops: [...selectedTrail.stops] };
    setSelectedTrail(activeTrail); setActiveTrailId(activeTrail.id); setSelectedStop(null); onTrailStateChange(activeTrail, progress); setMode('closed');
  };
  const exitTrail = () => { setMode('closed'); setSelectedStop(null); setSelectedTrail(null); setActiveTrailId(null); onTrailStateChange(null, null); };
  const continueTrail = async () => {
    if (!selectedTrail || !trailProgress) return;
    const next = trailProgress.currentStop + 1;
    const updated: TrailProgress = { ...trailProgress, currentStop: next, completed: next > selectedTrail.stops.length, completedAt: next > selectedTrail.stops.length ? new Date().toISOString() : null };
    setBusy(true); await saveTrailProgress(updated); setTrailProgress(updated); onTrailStateChange(selectedTrail, updated); setBusy(false); setSelectedStop(null);
  };
    const addStop = () => {
    if (!stopSong) return;
    const trailId = 'draft-trail';
    setStops(current => [...current, { id: crypto.randomUUID(), trailId, song: stopSong, stopOrder: current.length + 1, latitude: builderPoint.latitude, longitude: builderPoint.longitude, placeName: placeName.trim() || `Stop ${current.length + 1}`, note: stopNote.trim(), unlockRadius }]);
    setStopSong(null); setSongQuery(''); setStopNote(''); setPlaceName(`Stop ${stops.length + 2}`);
  };
  const reorder = (from: number, to: number) => { if (from === to || from < 0 || to < 0 || to >= sortedStops.length) return; const next = [...sortedStops]; const [item] = next.splice(from, 1); next.splice(to, 0, item); const arranged = next.map((stop, index) => ({ ...stop, stopOrder: index + 1 })); setStops(arranged); if (selectedTrail?.id === 'draft-trail') { const preview = { ...selectedTrail, stops: arranged }; setSelectedTrail(preview); onTrailStateChange(preview, null); } };
  const previewTrail: MusicTrail = { id: 'draft-trail', creatorId: 'local', title: title.trim() || 'New Trail', description, coverUrl: sortedStops[0]?.song.coverUrl || '', totalDistance: Math.round(totalDistance), estimatedMinutes: Math.max(1, Math.round(totalDistance / 80)), isPublic: true, createdAt: new Date().toISOString(), stops: sortedStops.map((stop, index) => ({ ...stop, trailId: 'draft-trail', stopOrder: index + 1 })) };
  const showPreviewOnMap = () => { setSelectedTrail(previewTrail); setTrailProgress(null); onTrailStateChange(previewTrail, null); setCreateStep('preview'); };
  const publish = async () => {
    if (sortedStops.length < 2 || !title.trim()) return;
    setBusy(true); setError('');
    try { const trail: MusicTrail = { ...previewTrail, id: crypto.randomUUID(), stops: previewTrail.stops.map(stop => ({ ...stop, trailId: 'pending' })) }; trail.stops = trail.stops.map(stop => ({ ...stop, trailId: trail.id })); await publishTrail(trail); const next = await fetchTrails(); setTrails(next); setSelectedTrail(trail); setTrailProgress(null); onTrailStateChange(trail, null); setMode('detail'); }
    catch { setError('Could not publish this Trail. Please try again.'); }
    finally { setBusy(false); }
  };
    const toggleTrailLike = (songId: string) => { const next = localLiked.includes(songId) ? localLiked.filter(id => id !== songId) : [...localLiked, songId]; setLocalLiked(next); localStorage.setItem('soundmap.trail-liked-songs.v1', JSON.stringify(next)); };
  const isStopDone = Boolean(selectedTrail && trailProgress && trailProgress.currentStop > selectedTrail.stops.length);
  const isTrailActive = Boolean(selectedTrail && activeTrailId === selectedTrail.id);

  return <>
    {libraryMode?<div className="library-trail-list"><div className="library-trail-tabs">{(['my','started','completed'] as const).map(tab=><button key={tab} className={libraryTab===tab?'selected':''} onClick={()=>setLibraryTab(tab)}>{tab==='my'?'My Trails':tab==='started'?'Started':'Completed'}</button>)}</div>{trails.filter(trail=>libraryTab==='my'?trail.creatorId==='local':libraryTab==='started'?Boolean(libraryProgress[trail.id]&&!libraryProgress[trail.id]?.completed):Boolean(libraryProgress[trail.id]?.completed)).map(trail=><button className="trail-card" key={trail.id} onClick={()=>{onOpenFromLibrary?.();void chooseTrail(trail)}}><img src={trail.coverUrl} alt=""/><span className="trail-card-copy"><strong>{trail.title}</strong><small>{trail.description}</small><em>{trail.stops.length} songs · {(trail.totalDistance/1000).toFixed(1)} km · {trail.estimatedMinutes} min</em></span><ArrowRight size={17}/></button>)}{!trails.some(trail=>libraryTab==='my'?trail.creatorId==='local':libraryTab==='started'?Boolean(libraryProgress[trail.id]&&!libraryProgress[trail.id]?.completed):Boolean(libraryProgress[trail.id]?.completed))&&<p className="library-trail-empty">{libraryTab==='my'?'Your published Trails will appear here.':libraryTab==='started'?'Trails you start will appear here.':'Completed Trails will appear here.'}</p>}</div>:showExplore?<button className="trails-entry glass" onClick={()=>{setMode('explore');setSelectedStop(null)}}><Music2 size={14}/>Explore Trails</button>:null}
    <AnimatePresence>{mode!=='closed'&&<motion.div className="trail-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><section className="trail-sheet glass">
      <div className="sheet-grabber"/><button className="trail-close icon-button" aria-label="Close" onClick={()=>{setMode('closed');setSelectedStop(null)}}><X size={20}/></button>
      {mode==='explore'&&<><header className="trail-sheet-heading"><span className="eyebrow">WALK INTO A PLAYLIST</span><h2>Explore Trails</h2><p>A playlist you walk through.</p></header><div className="trail-card-list">{trails.map(trail=>{const nearest=trail.stops.reduce((best,stop)=>Math.min(best,location?getDistanceMeters(location.latitude,location.longitude,stop.latitude,stop.longitude):Infinity),Infinity);return <button className="trail-card" key={trail.id} onClick={()=>void chooseTrail(trail)}><img src={trail.coverUrl} alt=""/><span className="trail-card-copy"><strong>{trail.title}</strong><small>{trail.description}</small><em>{trail.stops.length} songs · {(trail.totalDistance/1000).toFixed(1)} km · {trail.estimatedMinutes} min · {Number.isFinite(nearest)?`${Math.round(nearest)} m away`:'Shanghai'}</em></span><ArrowRight size={17}/></button>})}</div></>}
      {mode==='detail'&&selectedTrail&&<><button className="trail-back" onClick={()=>{setMode('explore');setSelectedStop(null)}}><ArrowLeft size={16}/>Trails</button><header className="trail-sheet-heading"><span className="eyebrow">MUSIC TRAIL</span><h2>{isStopDone?'Trail Complete':selectedTrail.title}</h2><p>{isStopDone?'A quiet route, now part of your map.':selectedTrail.description}</p></header><div className="trail-stats"><span><Music2 size={15}/>{selectedTrail.stops.length} songs</span><span><MapPin size={15}/>{(selectedTrail.totalDistance/1000).toFixed(1)} km</span><span><Clock3 size={15}/>{selectedTrail.estimatedMinutes} min</span></div>{isStopDone?<div className="trail-complete"><strong>{selectedTrail.stops.length} songs discovered</strong><span>{(selectedTrail.totalDistance/1000).toFixed(1)} km · {selectedTrail.estimatedMinutes} min</span><button onClick={exitTrail}>{isTrailActive?'Exit this Trail':'Done'}</button></div>:<><div className="trail-progress-copy">{trailProgress?`Stop ${Math.min(trailProgress.currentStop,selectedTrail.stops.length)} of ${selectedTrail.stops.length}`:'Ready when you are'}</div>{trailProgress&&<ol className="trail-stop-list">{selectedTrail.stops.map(stop=><li key={stop.id} className={stop.stopOrder<trailProgress.currentStop?'done':stop.stopOrder===trailProgress.currentStop?'active':''} onClick={()=>setSelectedStop(stop)}><span className="trail-stop-number">{stop.stopOrder<trailProgress.currentStop?<Check size={14}/>:stop.stopOrder}</span><span><strong>{stop.placeName}</strong><small>{stop.stopOrder<trailProgress.currentStop?stop.song.title:stop.stopOrder===trailProgress.currentStop&&canUnlock?stop.song.title:'Locked'}</small></span></li>)}</ol>}<button className="trail-primary" disabled={busy} onClick={()=>isTrailActive?exitTrail():void goOnTrail()}>{busy?'Starting…':isTrailActive?'Exit this Trail':'Go on this Trail'}{isTrailActive?<X size={17}/>:<ArrowRight size={17}/>}</button></>}</>}
      {mode==='create'&&<><header className="trail-sheet-heading"><span className="eyebrow">CREATE A TRAIL · {createStep==='info'?'1':createStep==='stops'?'2':'3'} OF 3</span><h2>{createStep==='info'?'Trail Info':createStep==='stops'?'Add Stops':'Preview Trail'}</h2><p>{createStep==='info'?'Give this walk a name and a feeling.':createStep==='stops'?'Choose each place and its song.':'Review the route before publishing.'}</p></header>
        {createStep==='info'&&<div className="trail-create-form"><input maxLength={70} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Trail title"/><textarea maxLength={240} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description"/><button className="trail-primary" disabled={!title.trim()} onClick={()=>setCreateStep('stops')}>Add Stops<ArrowRight size={17}/></button></div>}
        {createStep==='stops'&&<div className="trail-builder"><div className="trail-builder-map"><div className="pin-map"><PositionPicker value={builderPoint} onChange={setBuilderPoint} darkMode={document.documentElement.dataset.theme==='dark'}/></div><p className="trail-map-help">Move the map to choose this stop’s location.</p></div><div className="trail-stop-fields"><input maxLength={60} value={placeName} onChange={e=>setPlaceName(e.target.value)} placeholder="Place name"/><div className="trail-song-search"><Search size={16}/><input value={songQuery} onChange={e=>setSongQuery(e.target.value)} placeholder="Search songs"/></div><div className="trail-song-results">{songResults.slice(0,6).map(song=><button key={song.id} className={stopSong?.id===song.id?'selected':''} onClick={()=>setStopSong(song)}><img src={song.coverUrl} alt=""/><span><strong>{song.title}</strong><small>{song.artist}</small></span></button>)}</div><textarea maxLength={120} value={stopNote} onChange={e=>setStopNote(e.target.value)} placeholder="Optional note for this stop"/><label>Unlock radius <select value={unlockRadius} onChange={e=>setUnlockRadius(Number(e.target.value))}>{[20,50,100,300].map(radius=><option key={radius} value={radius}>{radius} m</option>)}</select></label><button className="trail-add-stop" disabled={!stopSong||stops.length>=10} onClick={addStop}><Plus size={16}/>Add Stop {stops.length+1}/10</button></div><div className="trail-sort-list">{sortedStops.map((stop,index)=><div key={stop.id} draggable onDragStart={()=>setDraggedIndex(index)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(draggedIndex!==null)reorder(draggedIndex,index);setDraggedIndex(null)}}><span>{index+1}.</span><span><strong>{stop.placeName}</strong><small>{stop.song.title}</small></span><button aria-label="Move stop up" disabled={!index} onClick={()=>reorder(index,index-1)}><ArrowUp size={15}/></button><button aria-label="Move stop down" disabled={index===sortedStops.length-1} onClick={()=>reorder(index,index+1)}><ArrowDown size={15}/></button></div>)}</div><footer className="trail-footer"><button className="echo-back" onClick={()=>setCreateStep('info')}><ArrowLeft size={16}/>Back</button><button className="trail-primary" disabled={stops.length<2} onClick={showPreviewOnMap}>Preview {stops.length} stops<ArrowRight size={17}/></button></footer></div>}
        {createStep==='preview'&&<><div className="trail-preview-info"><h3>{title}</h3><p>{stops.length} stops · {(totalDistance/1000).toFixed(1)} km · {Math.max(1,Math.round(totalDistance/80))} min</p><ol>{sortedStops.map((stop,index)=><li key={stop.id}><span>{index+1}</span><strong>{stop.placeName}</strong><small>{stop.song.title} · {stop.song.artist}</small></li>)}</ol></div>{error&&<p className="echo-error">{error}</p>}<footer className="trail-footer"><button className="echo-back" onClick={()=>setCreateStep('stops')}><ArrowLeft size={16}/>Back</button><button className="trail-primary" disabled={busy||stops.length<2} onClick={()=>void publish()}>{busy?'Publishing…':'Publish Trail'}</button></footer></>}
      </>}
      {selectedStop&&selectedTrail&&<div className="trail-stop-modal"><button className="trail-back" onClick={()=>setSelectedStop(null)}><ArrowLeft size={16}/>Trail</button><span className="eyebrow">STOP {selectedStop.stopOrder} · {selectedStop.placeName}</span>{!trailProgress?<><p className="trail-locked">Start this Trail to unlock its stops.</p><button className="trail-primary" onClick={()=>void startTrail()}>Start Trail<ArrowRight size={17}/></button></>:selectedStop.stopOrder===trailProgress.currentStop&&canUnlock?<><div className="trail-stop-song"><img src={selectedStop.song.coverUrl} alt=""/><span><strong>{selectedStop.song.title}</strong><small>{selectedStop.song.artist}</small></span></div><AudioPlayer song={selectedStop.song} isPlaying={currentTrackId===selectedStop.song.id&&isPlaying} progress={currentTrackId===selectedStop.song.id?progress:0} duration={currentTrackId===selectedStop.song.id?duration:0} onToggle={()=>onToggleSong(selectedStop.song)} onSeek={onSeek}/>{selectedStop.note&&<p className="trail-stop-note">“{selectedStop.note}”</p>}<div className="trail-stop-actions"><button className="drop-like" onClick={()=>toggleTrailLike(selectedStop.song.id)}><Heart size={16} fill={localLiked.includes(selectedStop.song.id)?'currentColor':'none'}/>{localLiked.includes(selectedStop.song.id)?'Resonated':'Resonate'}</button><button className="drop-like" onClick={()=>onSaveSong(selectedStop.song)}><Bookmark size={16}/>Save</button></div>{finishedSongId===selectedStop.song.id&&<button className="trail-primary" onClick={()=>void continueTrail()} disabled={busy}>{trailProgress.currentStop===selectedTrail.stops.length?'Finish Trail':'Continue Trail'}<ArrowRight size={17}/></button>}</>:<><p className="trail-locked">{selectedStop.stopOrder<trailProgress?.currentStop?'Completed':`Locked · ${Math.max(0,Math.round(selectedDistance))} m away`}</p>{selectedStop.stopOrder===trailProgress?.currentStop&&<button className="trail-demo-arrive" onClick={()=>onDemoLocation({latitude:selectedStop.latitude,longitude:selectedStop.longitude})}>Try nearby in Demo Mode</button>}</>}</div>}
    </section></motion.div>}</AnimatePresence>
  </>;
}
