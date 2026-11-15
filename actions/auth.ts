"use server"

import { redirect } from "next/navigation"
import { getAppUrl, safeNextPath } from "@/lib/env"
import { invitationKeepsSession } from "@/lib/auth/invite-session"
import { isE2eSignupNoEmailEnabled } from "@/lib/auth/e2e-signup-no-email"
import {
  PASSWORD_RESET_NEUTRAL_MESSAGE,
  buildMagicLinkRedirectTo,
  buildPasswordResetRedirectTo,
  passwordResetRateLimitMessage,
} from "@/lib/auth/password-reset"
import { createClient } from "@/lib/supabase/server"
import {
  MARKETING_CONSENT_VERSION,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from "@/lib/onboarding/catalog"
import { signupOnboardingSchema } from "@/lib/onboarding/validators"
import { verifyTurnstileToken } from "@/lib/security/turnstile"
import {
  forgotPasswordSchema,
  inviteSchema,
  loginSchema,
  magicLinkSchema,
  profileSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth"

function authMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes("rate limit")) {
    return "Trop d'e-mails d'authentification ont été envoyés. Réessayez dans une heure, ou configurez un SMTP Auth dédié sur le projet Supabase."
  }
  if (normalized.includes("email address") && normalized.includes("invalid")) {
    return "Cette adresse e-mail n'est pas acceptée. Utilisez une adresse professionnelle valide."
  }
  if (normalized.includes("invalid login")) return "Email ou mot de passe incorrect."
  if (normalized.includes("email not confirmed")) return "Confirmez votre email avant de vous connecter."
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "Un compte existe déjà avec cet email."
  }
  if (normalized.includes("invitation") || normalized.includes("invite")) {
    return "Ce compte n'est pas encore membre de l'équipe Mawaki Score. Demandez une invitation à un administrateur."
  }
  return "La connexion a échoué. Réessayez."
}

function needsOrganizationOnboarding(message: string) {
  return /organisation_required/i.test(message)
}

export async function signIn(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: authMessage(error.message) }

  const next = safeNextPath(String(formData.get("next") ?? ""))
  const { error: bootError } = await supabase.rpc("bootstrap_membership")
  if (bootError) {
    if (await invitationKeepsSession(next)) redirect(next)
    // New multi-tenant owners have a session but no org yet → onboarding, not sign-out.
    if (needsOrganizationOnboarding(bootError.message)) redirect("/onboarding")
    await supabase.auth.signOut()
    return { error: authMessage(bootError.message) }
  }

  redirect(next)
}

export async function signUp(formData: FormData) {
  const parsed = signupOnboardingSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    country: formData.get("country"),
    acceptTerms: formData.get("acceptTerms") === "true" || formData.get("acceptTerms") === "on",
    marketingConsent: formData.get("marketingConsent") === "true" || formData.get("marketingConsent") === "on",
    turnstileToken: String(formData.get("turnstileToken") ?? "") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." }

  const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken)
  if (!turnstile.ok) return { error: turnstile.error }

  // Local E2E only (dev-e2e.mjs). Hard-ignored when NODE_ENV or VERCEL_ENV is production.
  if (isE2eSignupNoEmailEnabled()) {
    return { message: "Compte créé. Ouvrez le lien reçu par email pour activer l'accès." }
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim()
  const next = safeNextPath(String(formData.get("next") ?? ""))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: fullName,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        country_code: parsed.data.country,
      },
      emailRedirectTo: buildMagicLinkRedirectTo(getAppUrl(), next),
    },
  })

  if (error) return { error: authMessage(error.message) }

  const now = new Date().toISOString()
  if (data.user?.id) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email: parsed.data.email,
        full_name: fullName,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        country_code: parsed.data.country,
        terms_accepted_at: now,
        terms_version: TERMS_VERSION,
        privacy_accepted_at: now,
        privacy_version: PRIVACY_VERSION,
        marketing_consent_at: parsed.data.marketingConsent ? now : null,
        marketing_consent_version: parsed.data.marketingConsent ? MARKETING_CONSENT_VERSION : null,
      },
      { onConflict: "id" },
    )
  }

  if (!data.session) {
    return { message: "Compte créé. Ouvrez le lien reçu par email pour activer l'accès." }
  }

  const { error: bootError } = await supabase.rpc("bootstrap_membership")
  if (bootError) {
    if (await invitationKeepsSession(next)) redirect(next)
    if (needsOrganizationOnboarding(bootError.message)) redirect("/onboarding")
    await supabase.auth.signOut()
    return { error: authMessage(bootError.message) }
  }

  redirect(next)
}

export async function sendMagicLink(formData: FormData) {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Email invalide." }

  const next = safeNextPath(String(formData.get("next") ?? ""))
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: buildMagicLinkRedirectTo(getAppUrl(), next) },
  })

  if (error) return { error: "Le lien magique n'a pas pu être envoyé." }
  return { message: "Lien envoyé. Consultez votre boîte email." }
}

/** Always returns the same neutral message (no account-existence leak). */
export async function requestPasswordReset(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Email invalide." }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: buildPasswordResetRedirectTo(getAppUrl()),
  })

  if (error) {
    const rate = passwordResetRateLimitMessage(error.message)
    if (rate) return { error: rate, rateLimited: true as const }
    // Still neutral — do not reveal whether the address exists or SMTP failed in detail.
    return { message: PASSWORD_RESET_NEUTRAL_MESSAGE }
  }

  return { message: PASSWORD_RESET_NEUTRAL_MESSAGE }
}

export async function updatePasswordFromRecovery(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    mfaCode: formData.get("mfaCode") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Session de récupération invalide ou expirée.", expired: true as const }

  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const needsAal2 = aal.data?.currentLevel !== "aal2" && aal.data?.nextLevel === "aal2"
  if (needsAal2) {
    const code = parsed.data.mfaCode?.trim() ?? ""
    if (!/^\d{6}$/.test(code)) {
      return { error: "Saisissez le code MFA à 6 chiffres pour confirmer.", mfaRequired: true as const }
    }
    const factors = await supabase.auth.mfa.listFactors()
    const factorId = factors.data?.totp?.[0]?.id
    if (!factorId) return { error: "Aucun facteur MFA trouvé sur ce compte.", mfaRequired: true as const }
    const challenge = await supabase.auth.mfa.challenge({ factorId })
    if (challenge.error || !challenge.data) {
      return { error: "Impossible de vérifier le MFA. Réessayez.", mfaRequired: true as const }
    }
    const verified = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    })
    if (verified.error) return { error: "Code MFA incorrect.", mfaRequired: true as const }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes("aal") || msg.includes("mfa") || msg.includes("assurance")) {
      return { error: "Saisissez le code MFA à 6 chiffres pour confirmer.", mfaRequired: true as const }
    }
    if (msg.includes("same password") || msg.includes("should be different")) {
      return { error: "Choisissez un mot de passe différent de l'ancien." }
    }
    return { error: "Le mot de passe n'a pas pu être mis à jour. Réessayez." }
  }

  try {
    await supabase.auth.signOut({ scope: "others" })
  } catch {
    // Optional — ignore if provider rejects scope.
  }
  await supabase.auth.signOut({ scope: "local" })
  redirect("/login?message=password_updated")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function signOutToLogin(formData: FormData) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const next = safeNextPath(String(formData.get("next") ?? ""))
  redirect(next.startsWith("/invite/") ? `/login?next=${encodeURIComponent(next)}` : "/login")
}

export async function updateProfile(formData: FormData) {
  const parsed = profileSchema.safeParse({ fullName: formData.get("fullName") })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nom invalide." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Session expirée." }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id)

  if (error) return { error: "Le profil n'a pas pu être mis à jour." }
  return { message: "Profil enregistré." }
}

export async function inviteMember(formData: FormData) {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invitation invalide." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("add_organization_member", {
    member_email: parsed.data.email,
    member_role: parsed.data.role,
  })

  if (error) {
    return { error: error.message.includes("Aucun compte") ? error.message : "L'invitation a échoué." }
  }
  return { message: "Membre ajouté à Mawaki Score." }
}

export async function removeMember(userId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc("remove_organization_member", { target_user: userId })
  if (error) return { error: "Ce membre n'a pas pu être retiré." }
  return { message: "Membre retiré." }
}
