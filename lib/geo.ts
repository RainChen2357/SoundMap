export interface Coordinates { latitude: number; longitude: number }
export function getDistanceMeters(lat1:number,lng1:number,lat2:number,lng2:number):number { const r=6371000, rad=(n:number)=>n*Math.PI/180; const dLat=rad(lat2-lat1),dLng=rad(lng2-lng1); const a=Math.sin(dLat/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLng/2)**2; return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }
export function formatDistance(m:number):string { return m<1000?`${Math.max(1,Math.round(m))} m away`:`${(m/1000).toFixed(1)} km away`; }
