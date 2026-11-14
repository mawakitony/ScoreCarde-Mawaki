export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { assertAllowedSupabaseEnv } = await import("@/lib/env/allowed-supabase")
  // Runtime whitelist — blocks a Vercel env drift even without rebuild when Node boots.
  assertAllowedSupabaseEnv()
  if (process.env.NEXT_PHASE === "phase-production-build") return
  const { assertProductionEnv } = await import("@/lib/env")
  assertProductionEnv()
}
