import "server-only"
import { createClient } from "@supabase/supabase-js"
import { assertAllowedSupabaseUrl } from "@/lib/env/allowed-supabase"
import type { Database } from "@/types/database"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY est absente.")
  }
  assertAllowedSupabaseUrl(url)

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
