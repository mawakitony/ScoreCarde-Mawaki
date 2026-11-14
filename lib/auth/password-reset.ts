/** Shared password-reset copy and pure helpers (no secrets). */

export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_RESET_NEUTRAL_MESSAGE =
  "Si un compte existe pour cette adresse, vous allez recevoir un e-mail."

export const PASSWORD_UPDATED_LOGIN_MESSAGE = "Mot de passe modifié, connectez-vous."

export function isPasswordResetNext(path: string) {
  return path === "/reset-password" || path.startsWith("/reset-password?")
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
