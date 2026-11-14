export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export function isServiceRoleConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

const PRODUCTION_REQUIRED = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "INTEGRATIONS_SECRET", "NEXT_PUBLIC_APP_URL", "CRON_SECRET"] as const

export function missingProductionEnv(env: Record<string, string | undefined> = process.env) {
  if (env.NODE_ENV !== "production") return []
  return PRODUCTION_REQUIRED.filter((key) => !env[key]?.trim())
}

export function assertProductionEnv() {
  const missing = missingProductionEnv()
  if (missing.length) throw new Error(`Missing production environment: ${missing.join(", ")}`)
}

export function e2eDatabaseAllowed(env: Record<string, string | undefined> = process.env) {
  if (env.NODE_ENV === "production") return false
  const target = env.E2E_SUPABASE_URL?.trim()
  if (!target) return false
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) return false
  return target !== env.NEXT_PUBLIC_SUPABASE_URL?.trim()
}

export function e2eCurrentDatabaseAllowed(env: Record<string, string | undefined> = process.env) {
  if (env.NODE_ENV === "production") return false
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) return false
  if (env.E2E_ALLOW_CURRENT !== "1") return false
  if (!/^E2E-WOLOYEM-\d+$/.test(env.E2E_PREFIX?.trim() ?? "")) return false
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY)
}

/**
 * Isolated Lot 7 E2E: the Next.js server under test must talk to the E2E project,
 * while E2E_PROTECT_SUPABASE_URL names the real/dev project that must never be seeded.
 */
export function e2eIsolatedAllowed(env: Record<string, string | undefined> = process.env) {
  if (env.NODE_ENV === "production") return false
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) return false
  const base = env.E2E_BASE_URL?.trim()
  const e2eUrl = env.E2E_SUPABASE_URL?.trim()
  const protect = env.E2E_PROTECT_SUPABASE_URL?.trim()
  const appUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!base || !e2eUrl || !protect || !appUrl) return false
  if (!env.E2E_SUPABASE_ANON_KEY?.trim() || !env.E2E_SUPABASE_SERVICE_ROLE_KEY?.trim()) return false
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || !env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return false
  if (e2eUrl === protect) return false
  if (appUrl !== e2eUrl) return false
  if (appUrl === protect) return false
  if (!/^E2E-WOLOYEM-\d+$/.test(env.E2E_PREFIX?.trim() ?? "")) return false
  return true
}

export function e2eIsolatedBlockReason(env: Record<string, string | undefined> = process.env) {
  if (env.NODE_ENV === "production") return "NODE_ENV=production"
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) return "STRIPE_SECRET_KEY is live"
  if (!env.E2E_BASE_URL?.trim()) return "E2E_BASE_URL missing"
  if (!env.E2E_SUPABASE_URL?.trim()) return "E2E_SUPABASE_URL missing"
  if (!env.E2E_PROTECT_SUPABASE_URL?.trim()) return "E2E_PROTECT_SUPABASE_URL missing"
  if (!env.E2E_SUPABASE_ANON_KEY?.trim()) return "E2E_SUPABASE_ANON_KEY missing"
  if (!env.E2E_SUPABASE_SERVICE_ROLE_KEY?.trim()) return "E2E_SUPABASE_SERVICE_ROLE_KEY missing"
  if (!env.NEXT_PUBLIC_SUPABASE_URL?.trim()) return "NEXT_PUBLIC_SUPABASE_URL missing"
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) return "NEXT_PUBLIC_SUPABASE_ANON_KEY missing"
  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return "SUPABASE_SERVICE_ROLE_KEY missing"
  if (!/^E2E-WOLOYEM-\d+$/.test(env.E2E_PREFIX?.trim() ?? "")) return "E2E_PREFIX must match E2E-WOLOYEM-<digits>"
  const e2eUrl = env.E2E_SUPABASE_URL!.trim()
  const protect = env.E2E_PROTECT_SUPABASE_URL!.trim()
  const appUrl = env.NEXT_PUBLIC_SUPABASE_URL!.trim()
  if (e2eUrl === protect) return "E2E_SUPABASE_URL must differ from E2E_PROTECT_SUPABASE_URL"
  if (appUrl !== e2eUrl) return "NEXT_PUBLIC_SUPABASE_URL must equal E2E_SUPABASE_URL for isolated runs"
  if (appUrl === protect) return "NEXT_PUBLIC_SUPABASE_URL must not equal the protected project"
  return null
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return "/dashboard"
  }
  if (/^\/invite\/[A-Za-z0-9_-]{20,}$/.test(value)) return value
  if (value.startsWith("/dashboard")) return value
  return "/dashboard"
}
