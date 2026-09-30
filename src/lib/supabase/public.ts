import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

let client: SupabaseClient | undefined;

/**
 * Cookieless anonymous client for public tenant sites. It only ever sees what
 * the RLS policies expose to `anon` (published tracks, non-draft events).
 */
export function createPublicClient() {
  client ??= createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
