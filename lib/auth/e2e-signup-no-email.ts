/**
 * Local E2E dry-run for signup (skip Auth SMTP).
 * Must never activate on Vercel Production or NODE_ENV=production — even if the env var is set by mistake.
 */
export function isE2eSignupNoEmailEnabled(env: NodeJS.ProcessEnv = process.env) {
  if (env.E2E_SIGNUP_NO_EMAIL !== "1") return false
  if (env.NODE_ENV === "production") return false
  if (env.VERCEL_ENV === "production") return false
  return true
}
