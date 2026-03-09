import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client — nutzt den Service Role Key (Bypass Row Level Security).
 * Nur serverseitig verwenden, niemals im Client-Code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
