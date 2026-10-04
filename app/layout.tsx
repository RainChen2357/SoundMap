import type { Metadata,Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'SoundMap — Leave a song somewhere in the world',description:'把一首歌，留在一个地方。发现现实世界里的音乐记忆。'};
export const viewport:Viewport={width:'device-width',initialScale:1,maximumScale:1,userScalable:false,themeColor:'#f5f5f7'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
