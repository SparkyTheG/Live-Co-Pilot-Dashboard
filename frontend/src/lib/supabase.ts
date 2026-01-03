import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// #region agent log
fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:6',message:'Raw env values',data:{supabaseUrl:supabaseUrl,supabaseAnonKeyLength:supabaseAnonKey?.length,supabaseAnonKeyStart:supabaseAnonKey?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Check if Supabase is properly configured (not placeholders)
const isSupabaseConfigured = () => {
  const checks = {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    notPlaceholderUrl: supabaseUrl !== 'https://placeholder.supabase.co',
    notPlaceholderKey: supabaseAnonKey !== 'placeholder-anon-key',
    startsWithHttps: supabaseUrl?.startsWith('https://'),
    includesSupabaseCo: supabaseUrl?.includes('.supabase.co'),
  };
  const result = checks.hasUrl && checks.hasKey && checks.notPlaceholderUrl && checks.notPlaceholderKey && checks.startsWithHttps && checks.includesSupabaseCo;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:isSupabaseConfigured',message:'Config check results',data:{checks,result},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return result;
};

// Only create Supabase client if properly configured
// For auth features, we need a real client or a mock that won't crash
export const supabase: SupabaseClient<any> = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : ({
      from: (table: string) => ({
        select: () => Promise.resolve({ data: null, error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as any);

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => isSupabaseConfigured();

if (!isSupabaseConfigured()) {
  console.warn('⚠️ Supabase not configured. Features requiring Supabase (auth, settings sync) will use local storage only.');
}
