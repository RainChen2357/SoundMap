import { songs } from './songs';
import type { MusicDrop } from '@/types/drop';
const places=['复旦大学','武康路','上海音乐学院','世纪公园','思南公馆','徐家汇公园','愚园路','静安寺','外滩','上生新所','田子坊','东华大学','长乐路','中山公园','新华路'];
const notes=['那天风很轻，这首歌陪我走了很久。','第一次来这里的时候，我一直在循环这首歌。','留给某个刚好路过的人。','如果你也喜欢这首歌，今天就不算太糟。','给未来某个在这里停下脚步的人。'];
const coords:[[number,number],...Array<[number,number]>]=[[31.2304,121.4737],[31.2078,121.4481],[31.199,121.436],[31.219,121.446],[31.228,121.459],[31.223,121.465],[31.236,121.478],[31.214,121.458],[31.241,121.49],[31.225,121.438],[31.203,121.45],[31.237,121.455],[31.217,121.48],[31.25,121.44],[31.232,121.452]];
export const demoDrops:MusicDrop[]=Array.from({length:55},(_,i)=>{const [lat,lng]=coords[(i*7+Math.floor(i/5))%coords.length];const hidden=i<15;return{id:`drop-${i+1}`,creatorId:`user-${i%20+1}`,song:songs[i%songs.length],latitude:lat+((i%5)-2)*.0018,longitude:lng+((i%7)-3)*.0017,placeName:places[i%places.length],note:notes[i%notes.length],visibility:hidden?'hidden':'public',discoveryRadius:1000,unlockRadius:[20,50,100,300][i%4],discoveryCount:(i*13)%43,isActive:true,createdAt:new Date(Date.now()-i*86400000).toISOString()}});
