/** Shared password-reset copy and pure helpers (no secrets). */

export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_RESET_NEUTRAL_MESSAGE =
  "Si un compte existe pour cette adresse, vous allez recevoir un e-mail."

export const PASSWORD_UPDATED_LOGIN_MESSAGE = "Mot de passe modifié, connectez-vous."

export function isPasswordResetNext(path: string) {
  return path === "/reset-password" || path.startsWith("/reset-password?")
}

/**
 * redirectTo for resetPasswordForEmail — always includes ?next= so email templates can append
 * `&token_hash=…&type=recovery` onto {{ .RedirectTo }} (not {{ .SiteURL }}).
 */
export function buildPasswordResetRedirectTo(appUrl: string) {
  const base = appUrl.replace(/\/$/, "")
  return `${base}/auth/confirm?next=${encodeURIComponent("/reset-password")}`
}

/** Magic-link / confirm email redirect (PKCE lands on /auth/callback with ?code=). */
export function buildMagicLinkRedirectTo(appUrl: string, nextPath: string) {
  const base = appUrl.replace(/\/$/, "")
  const next = nextPath.startsWith("/") ? nextPath : "/dashboard"
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`
}

/**
 * Parse /auth/confirm query as produced by:
 *   {{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery
 * RedirectTo already contains ?next=/reset-password
 */
export function parseAuthConfirmSearchParams(search: string | URLSearchParams) {
  const params = typeof search === "string" ? new URLSearchParams(search.replace(/^\?/, "")) : search
  return {
    next: params.get("next"),
    token_hash: params.get("token_hash"),
    type: params.get("type"),
    code: params.get("code"),
  }
}

export function passwordResetRateLimitMessage(raw: string) {
  const normalized = raw.toLowerCase()
  if (normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit")) {
    return "Trop de demandes. Réessayez dans une heure."
  }
  return null
}

export function passwordsMatch(password: string, confirm: string) {
  return password === confirm
}

export function passwordMeetsPolicy(password: string, minLength = PASSWORD_MIN_LENGTH) {
  return password.length >= minLength
}
