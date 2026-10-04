'use client';
import Map,{Marker,type MapRef} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import type { MusicDrop } from '@/types/drop';
import type { Coordinates } from '@/lib/geo';
import { Music2 } from 'lucide-react';
import { getDistanceMeters } from '@/lib/geo';
import { getSoundMapStyle } from './map-style';

interface Props{drops:MusicDrop[];location:Coordinates|null;darkMode?:boolean;onSelect:(d:MusicDrop)=>void;onMapMove?:(coords:Coordinates)=>void;activeId?:string}
interface Cluster{ id:string; latitude:number; longitude:number; drops:MusicDrop[] }

export default function SoundMap({drops,location,darkMode=false,onSelect,onMapMove,activeId}:Props){
 const mapRef=useRef<MapRef>(null);
 const markerPosition=useCallback((drop:MusicDrop)=>{const distance=location?getDistanceMeters(location.latitude,location.longitude,drop.latitude,drop.longitude):Infinity;const blurred=drop.visibility==='hidden'&&distance>drop.unlockRadius;const angle=(Array.from(drop.id).reduce((a,c)=>a+c.charCodeAt(0),0)%360)*Math.PI/180;const offset=blurred?220:0;return{latitude:drop.latitude+Math.cos(angle)*offset/111320,longitude:drop.longitude+Math.sin(angle)*offset/(111320*Math.cos(drop.latitude*Math.PI/180))}},[location]);
 const [clusters,setClusters]=useState<Cluster[]>([]);
 const recalculateClusters=useCallback(()=>{
  const map=mapRef.current;
  if(!map||drops.length<2){setClusters([]);return}
  const points=drops.map(drop=>{const position=markerPosition(drop);return{drop,position,point:map.project([position.longitude,position.latitude])}});
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
 },[drops,markerPosition]);
 useEffect(()=>{recalculateClusters()},[recalculateClusters]);
 const clusteredIds=useMemo(()=>new Set(clusters.flatMap(c=>c.drops.map(d=>d.id))),[clusters]);
 const openCluster=(cluster:Cluster)=>{const map=mapRef.current;if(!map)return;const zoom=map.getZoom();map.flyTo({center:[cluster.longitude,cluster.latitude],zoom:Math.min(zoom+2.2,18),duration:650})};
 return <><Map ref={mapRef} initialViewState={{longitude:121.4737,latitude:31.2304,zoom:13}} mapStyle={getSoundMapStyle(darkMode)} onLoad={recalculateClusters} onMove={e=>onMapMove?.({latitude:e.viewState.latitude,longitude:e.viewState.longitude})} onMoveEnd={recalculateClusters} dragRotate={false} pitchWithRotate={false} touchPitch={false} cooperativeGestures>
  {clusters.map(cluster=><Marker key={cluster.id} longitude={cluster.longitude} latitude={cluster.latitude} anchor="center"><button className="cluster-marker" aria-label={`Zoom in to see ${cluster.drops.length} songs`} onClick={()=>openCluster(cluster)}><span>{cluster.drops.length}</span></button></Marker>)}
  {drops.filter(d=>!clusteredIds.has(d.id)).map(d=>{const position=markerPosition(d);return <Marker key={d.id} longitude={position.longitude} latitude={position.latitude} anchor="bottom" onClick={e=>{e.originalEvent.stopPropagation();onSelect(d)}}><button aria-label={d.visibility==='hidden'?'Hidden song':'Open '+d.song.title} className={`map-marker ${d.id===activeId?'is-active':''} ${d.visibility==='hidden'?'is-hidden':''}`} onClick={()=>onSelect(d)}>{d.visibility==='hidden'?<Music2 size={17}/>:<img src={d.song.coverUrl} alt=""/>}</button></Marker>})}
  {location&&<Marker longitude={location.longitude} latitude={location.latitude} anchor="center"><span className="user-location" aria-label="Your demo location"><span/></span></Marker>}
 </Map></>
}
