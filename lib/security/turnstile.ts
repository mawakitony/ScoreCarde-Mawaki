/** Cloudflare Turnstile — optional. Disabled cleanly when env keys are absent. */

export function isTurnstileConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.TURNSTILE_SITE_KEY?.trim() && env.TURNSTILE_SECRET_KEY?.trim())
}

export function turnstileSiteKey(env: NodeJS.ProcessEnv = process.env) {
  return env.TURNSTILE_SITE_KEY?.trim() || null
}

export async function verifyTurnstileToken(token: string | undefined, env: NodeJS.ProcessEnv = process.env) {
  if (!isTurnstileConfigured(env)) return { ok: true as const, skipped: true as const }
  if (!token?.trim()) return { ok: false as const, skipped: false as const, error: "Vérification anti-bot requise." }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY!.trim(),
    response: token.trim(),
  })
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    })
    const json = (await res.json()) as { success?: boolean }
    if (!json.success) return { ok: false as const, skipped: false as const, error: "Vérification anti-bot échouée." }
    return { ok: true as const, skipped: false as const }
  } catch {
    return { ok: false as const, skipped: false as const, error: "Vérification anti-bot indisponible." }
  }
}
