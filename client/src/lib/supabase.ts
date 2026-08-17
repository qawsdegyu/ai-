import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, getSupabaseAnonKey } from '@shared/supabaseConfig';

let supabaseInstance: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    // Vercel's static build may omit VITE_* values when project variables are missing.
    // Keep env vars as the primary source and use only the public Supabase anon key as fallback.
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
    const supabaseKey = getSupabaseAnonKey(import.meta.env.VITE_SUPABASE_ANON_KEY);
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration is missing.");
    }
    
    supabaseInstance = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  return supabaseInstance;
}

export const supabase = getSupabaseClient();
