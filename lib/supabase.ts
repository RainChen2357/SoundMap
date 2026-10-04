import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client:SupabaseClient|null=null;
export function getSupabase():SupabaseClient|null {const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(process.env.NEXT_PUBLIC_DEMO_MODE==='true'||!url||!key)return null;client??=createClient(url,key);return client;}
