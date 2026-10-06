'use client';
import Map,{Layer,Marker,Source,type MapRef} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import type { MusicDrop } from '@/types/drop';
import type { Coordinates } from '@/lib/geo';
import type { MusicTrail,TrailStop } from '@/types/trail';
import { AnimatePresence,motion } from 'framer-motion';
import { getSoundMapStyle } from './map-style';

interface Props{drops:MusicDrop[];location:Coordinates|null;darkMode?:boolean;onSelect:(d:MusicDrop)=>void;onMapMove?:(coords:Coordinates)=>void;activeId?:string;discoveredIds?:string[];trail?:MusicTrail|null;trailCurrentStop?:number;trailCompletedStops?:number[];onTrailStopSelect?:(stop:TrailStop)=>void}
interface Cluster{ id:string; latitude:number; longitude:number; drops:MusicDrop[] }

export default function SoundMap({drops,location,darkMode=false,onSelect,onMapMove,activeId,discoveredIds=[],trail,trailCurrentStop=1,trailCompletedStops=[],onTrailStopSelect}:Props){
 const mapRef=useRef<MapRef>(null);
 const discovered=useMemo(()=>new Set(discoveredIds),[discoveredIds]);
 const hiddenPosition=useCallback((drop:MusicDrop)=>{const angle=(Array.from(drop.id).reduce((a,c)=>a+c.charCodeAt(0),0)%360)*Math.PI/180;const offset=85;return{latitude:drop.latitude+Math.cos(angle)*offset/111320,longitude:drop.longitude+Math.sin(angle)*offset/(111320*Math.cos(drop.latitude*Math.PI/180))}},[]);
 const positionFor=useCallback((drop:MusicDrop)=>drop.visibility==='hidden'&&!discovered.has(drop.id)?hiddenPosition(drop):{latitude:drop.latitude,longitude:drop.longitude},[discovered,hiddenPosition]);
 const [clusters,setClusters]=useState<Cluster[]>([]);
 const recalculateClusters=useCallback(()=>{
  const map=mapRef.current;
  const clusterable=drops;
  if(!map||clusterable.length<2){setClusters([]);return}
  const points=clusterable.map(drop=>{const position=positionFor(drop);return{drop,position,point:map.project([position.longitude,position.latitude])}});
  const parent=points.map((_,i)=>i);
  const find=(n:number):number=>{if(parent[n]!==n)parent[n]=find(parent[n]);return parent[n]};
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
   const dx=points[i].point.x-points[j].point.x,dy=points[i].point.y-points[j].point.y;
   if(dx*dx+dy*dy<=54*54){const a=find(i),b=find(j);if(a!==b)parent[b]=a}
  }
  const groups=new globalThis.Map<number,MusicDrop[]>();
  points.forEach(({drop},i)=>{const root=find(i);const group=groups.get(root)||[];group.push(drop);groups.set(root,group)});
  const next:Cluster[]=[];
  groups.forEach((group,root)=>{if(group.length<2)return;const members=points.filter((_,i)=>find(i)===root);next.push({id:group.map(d=>d.id).sort().join('|'),latitude:members.reduce((n,p)=>n+p.position.latitude,0)/members.length,longitude:members.reduce((n,p)=>n+p.position.longitude,0)/members.length,drops:group})});
  setClusters(next);
 },[drops,positionFor]);
 useEffect(()=>{recalculateClusters()},[recalculateClusters]);
 useEffect(()=>{if(!trail?.stops.length||!mapRef.current)return;const map=mapRef.current;if(trail.stops.length===1){const stop=trail.stops[0];map.flyTo({center:[stop.longitude,stop.latitude],zoom:14.5,duration:800});return}const lons=trail.stops.map(stop=>stop.longitude),lats=trail.stops.map(stop=>stop.latitude);const west=Math.min(...lons),east=Math.max(...lons),south=Math.min(...lats),north=Math.max(...lats);const latPad=Math.max((north-south)*.12,.003),lngPad=Math.max((east-west)*.12,.003);map.fitBounds([[west-lngPad,south-latPad],[east+lngPad,north+latPad]],{padding:{top:120,bottom:135,left:90,right:90},maxZoom:14.5,duration:850})},[trail]);
 const clusteredIds=useMemo(()=>new Set(clusters.flatMap(c=>c.drops.map(d=>d.id))),[clusters]);
 const openCluster=(cluster:Cluster)=>{const map=mapRef.current;if(!map)return;const zoom=map.getZoom();map.flyTo({center:[cluster.longitude,cluster.latitude],zoom:Math.min(zoom+2.2,18),duration:650})};
 return <><Map ref={mapRef} initialViewState={{longitude:121.4737,latitude:31.2304,zoom:13}} mapStyle={getSoundMapStyle(darkMode)} onLoad={recalculateClusters} onMove={e=>onMapMove?.({latitude:e.viewState.latitude,longitude:e.viewState.longitude})} onMoveEnd={recalculateClusters} dragRotate={false} pitchWithRotate={false} touchPitch={false} cooperativeGestures>
  {trail&&trail.stops.length>1&&<Source id="music-trail-route" type="geojson" data={{type:'Feature',geometry:{type:'LineString',coordinates:trail.stops.map(stop=>[stop.longitude,stop.latitude])},properties:{}}}><Layer id="music-trail-line" type="line" paint={{'line-color':darkMode?'#aeb7c2':'#7b8490','line-width':3.5,'line-opacity':0.9,'line-dasharray':[2.2,1.4]}}/></Source>}
  {trail?.stops.map((stop:TrailStop)=>{const completed=trailCompletedStops.includes(stop.stopOrder);return <Marker key={stop.id} longitude={stop.longitude} latitude={stop.latitude} anchor="center"><button className={`trail-marker ${stop.stopOrder===trailCurrentStop?'current':''} ${completed?'completed has-cover':''}`} aria-label={completed?`Trail stop ${stop.stopOrder}: ${stop.song.title}`:`Trail stop ${stop.stopOrder}`} onClick={()=>onTrailStopSelect?.(stop)}>{completed?<img src={stop.song.coverUrl} alt=""/>:stop.stopOrder}</button></Marker>})}
  {clusters.map(cluster=><Marker key={cluster.id} longitude={cluster.longitude} latitude={cluster.latitude} anchor="center"><button className="cluster-marker" aria-label={`Zoom in to see ${cluster.drops.length} songs`} onClick={()=>openCluster(cluster)}><span>{cluster.drops.length}</span></button></Marker>)}
  {drops.filter(d=>!clusteredIds.has(d.id)).map(d=>{const isHidden=d.visibility==='hidden'&&!discovered.has(d.id);const position=positionFor(d);return <Marker key={d.id} longitude={position.longitude} latitude={position.latitude} anchor="center"><motion.button initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{duration:.28,ease:'easeOut'}} aria-label={isHidden?'Nearby hidden song':'Open '+d.song.title} className={`map-marker ${d.id===activeId?'is-active':''} ${isHidden?'is-treasure':''}`} onClick={()=>onSelect(d)}><AnimatePresence mode="wait" initial={false}>{isHidden?<motion.span key="hidden" className="treasure-hidden-content" initial={{opacity:1,scale:1}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.92}} transition={{duration:.2,ease:'easeOut'}}><span className="treasure-haze"/><span className="treasure-symbol">?</span></motion.span>:<motion.img key="album" initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{duration:.4,ease:'easeOut'}} src={d.song.coverUrl} alt=""/>}</AnimatePresence></motion.button></Marker>})}
  {location&&<Marker longitude={location.longitude} latitude={location.latitude} anchor="center"><span className="user-location" aria-label="Your demo location"><span/></span></Marker>}
 </Map></>
}
