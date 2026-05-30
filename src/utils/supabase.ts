import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Safely initialize Supabase. If credentials are empty during initial load, we will guide the user.
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key');

