import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig() {
  // Prefer server-named vars; allow fallback to VITE_* for convenience in Railway env setups.
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('https://') && url.includes('.supabase.co'));
}

/**
 * Create a Supabase client scoped to a user's access token (so RLS works).
 * IMPORTANT: This does NOT require a service role key; it uses the user JWT.
 */
export function createUserSupabaseClient(accessToken) {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  if (!accessToken) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}

