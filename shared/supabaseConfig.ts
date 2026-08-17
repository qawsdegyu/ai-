export const SUPABASE_URL = "https://dgfjqfntkkivnrwwsxle.supabase.co";

// This is the public anon key for the project above. It is safe for browser use;
// database access remains protected by Supabase RLS and server authorization.
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZmpxZm50a2tpdm5yd3dzeGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDEyMDcsImV4cCI6MjEwMjI3NzIwN30.ZgY7tK-w8iajPvRNzuMPe8Z2XwTWc4Lkqae_TGjfqKI";

export function getSupabaseAnonKey(candidate?: string): string {
  const value = candidate?.trim();
  if (value) return value;
  return SUPABASE_ANON_KEY;
}
