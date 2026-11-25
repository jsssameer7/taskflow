import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let initialized = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (initialized) {
    return cachedClient;
  }
  initialized = true;

  const url = process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    cachedClient = null;
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      console.error('[TaskFlow] SUPABASE_URL must start with https:// or http://');
      cachedClient = null;
      return null;
    }
  } catch {
    console.error('[TaskFlow] SUPABASE_URL is not a valid URL');
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
