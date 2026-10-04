'use client';
import Map,{Marker} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { MusicDrop } from '@/types/drop';
import type { Coordinates } from '@/lib/geo';
import { Music2 } from 'lucide-react';
import { getDistanceMeters } from '@/lib/geo';
import { getSoundMapStyle } from './map-style';
interface Props{drops:MusicDrop[];location:Coordinates|null;darkMode?:boolean;onSelect:(d:MusicDrop)=>void;onMapMove?:(coords:Coordinates)=>void;activeId?:string}
export default function SoundMap({drops,location,darkMode=false,onSelect,onMapMove,activeId}:Props){return <><Map initialViewState={{longitude:121.4737,latitude:31.2304,zoom:13}} mapStyle={getSoundMapStyle(darkMode)} onMove={e=>onMapMove?.({latitude:e.viewState.latitude,longitude:e.viewState.longitude})} dragRotate={false} pitchWithRotate={false} touchPitch={false} cooperativeGestures>{drops.map(d=>{const distance=location?getDistanceMeters(location.latitude,location.longitude,d.latitude,d.longitude):Infinity;const blurred=d.visibility==='hidden'&&distance>d.unlockRadius;const angle=(Array.from(d.id).reduce((a,c)=>a+c.charCodeAt(0),0)%360)*Math.PI/180;const offset=blurred?220:0;const markerLat=d.latitude+Math.cos(angle)*offset/111320;const markerLng=d.longitude+Math.sin(angle)*offset/(111320*Math.cos(d.latitude*Math.PI/180));return <Marker key={d.id} longitude={markerLng} latitude={markerLat} anchor="bottom" onClick={e=>{e.originalEvent.stopPropagation();onSelect(d)}}><button aria-label={d.visibility==='hidden'?'Hidden song':'Open '+d.song.title} className={`map-marker ${d.id===activeId?'is-active':''} ${d.visibility==='hidden'?'is-hidden':''}`} onClick={()=>onSelect(d)}>{d.visibility==='hidden'?<Music2 size={17}/>:<img src={d.song.coverUrl} alt=""/>}</button></Marker>})}{location&&<Marker longitude={location.longitude} latitude={location.latitude} anchor="center"><span className="user-location" aria-label="Your demo location"><span/></span></Marker>}</Map></>}
