// Replace the placeholders with your real Supabase info or export env variables in build
export const SUPABASE_URL = "https://YOUR_SUPABASE_PROJECT.supabase.co";
export const SUPABASE_PUBLIC_KEY = "YOUR_PUBLIC_ANON_KEY";

// For browser usage, we assume supabase-js is loaded via a bundler or CDN.
// If you use modules, import { createClient } from '@supabase/supabase-js' and create client.
// For simplicity: attach a client to window
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
