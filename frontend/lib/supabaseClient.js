import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cachedClient = null;

export function getSupabaseClient() {
  if (!url || !anonKey) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}
