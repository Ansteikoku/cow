// Replace the placeholders with your real Supabase info or export env variables in build
export const SUPABASE_URL = "https://dlaixxekopjapbpodbpc.supabase.co";
export const SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsYWl4eGVrb3BqYXBicG9kYnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzkyNDcsImV4cCI6MjA3OTY1NTI0N30.fYzvp76YSV4jlGK0CLZr_IBrh2iNx02G1tSFoyag0o4";

// For browser usage, we assume supabase-js is loaded via a bundler or CDN.
// If you use modules, import { createClient } from '@supabase/supabase-js' and create client.
// For simplicity: attach a client to window
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
