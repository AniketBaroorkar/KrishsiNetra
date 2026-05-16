import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedAdmin = null;

export function getSupabaseAdmin() {
  if (!url || !serviceRoleKey) return null;
  if (!cachedAdmin) {
    cachedAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedAdmin;
}

export function isSupabaseAdminConfigured() {
  return Boolean(url && serviceRoleKey);
}
