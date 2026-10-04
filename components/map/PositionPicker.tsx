'use client';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Coordinates } from '@/lib/geo';
import { MapPin } from 'lucide-react';
import { getSoundMapStyle } from './map-style';
export default function PositionPicker({value,onChange,darkMode=false}:{value:Coordinates;onChange:(c:Coordinates)=>void;darkMode?:boolean}){return <div className="position-picker"><Map initialViewState={{longitude:value.longitude,latitude:value.latitude,zoom:15}} mapStyle={getSoundMapStyle(darkMode)} onMove={e=>onChange({latitude:e.viewState.latitude,longitude:e.viewState.longitude})} dragRotate={false} touchPitch={false}><div className="picker-pin"><MapPin size={31} fill="currentColor"/></div></Map></div>}
