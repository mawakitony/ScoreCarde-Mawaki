"use server"

import { createHash, randomBytes } from "node:crypto"
import { cookies, headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  ACCESS_PROOF_COOKIE,
  MAX_ACCESS_ATTEMPTS,
  accessLink,
  accountPlan,
  createAccessCode,
  decideAccessCode,
  firstAccessEmailPayload,
  firstAccessExpiry,
  firstAccessHours,
  firstAccessIdempotencyKey,
  hashAccessCode,
  hashesMatch,
  openProof,
  sealProof,
  type AccessFailure,
  type AccessInvitation,
} from "@/lib/auth/first-access"
import { hashInviteToken } from "@/lib/auth/invitations"
import { can } from "@/lib/auth/permissions"
import { getUser } from "@/lib/auth/session"
import { loadEntitlements } from "@/lib/billing/account"
import { ensureMembership } from "@/lib/data/membership"
import { enqueueEmail } from "@/lib/email/queue"
import { getAppUrl } from "@/lib/env"
import { activeSuspension } from "@/lib/platform/data"
import { allowRate } from "@/lib/security/rate"
import { writeActivity } from "@/lib/audit/write"
import { deriveAppSecret, isIntegrationsSecretError } from "@/lib/security/app-secret"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { loginSchema } from "@/lib/validators/auth"

const ROLES = ["admin", "editor", "analyst", "viewer"]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const messages: Record<AccessFailure | "rate", string> = {
  missing: "Cette adresse ne correspond pas à un accès en attente.",
  email: "Cette adresse ne correspond pas à un accès en attente.",
  code: "Code incorrect.",
  expired: "Ce code a expiré.",
  used: "Ce code a déjà été utilisé.",
  cancelled: "Cette invitation a été annulée.",
  blocked: "Code temporairement bloqué.",
  inactive: "Cette organisation n'est pas active.",
  quota: "La limite de membres du plan est atteinte.",
  role: "Invitation invalide.",
  tenant: "Ce compte appartient déjà à une organisation.",
  rate: "Trop de tentatives. Réessayez plus tard.",
}

type InvitationRow = {
  id: string
  organization_id: string
  email: string
  role: string
  token_hash: string
  first_access_code_hash: string | null
  expires_at: string
  first_access_expires_at: string | null
  first_access_attempts: number
  first_access_used_at: string | null
  accepted_at: string | null
  cancelled_at: string | null
  invitation_type: string
}

function sealKey() {
  return deriveAppSecret("first-access-seal")
}

function cookieKey() {
  return deriveAppSecret("first-access-cookie")
}

function configSecretError() {
  return "Configuration serveur incomplète (INTEGRATIONS_SECRET)." as const
}

function storageError(message: string) {
  if (/column|schema cache|does not exist|invitation_type|first_access|cancelled_at/i.test(message)) {
    return "Appliquez la migration 20260927120000_first_access.sql."
  }
  return "L'accès n'a pas pu être préparé."
}

function accessError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes("rate limit")) return "Trop de tentatives pour le moment. Réessayez dans quelques minutes."
  if (normalized.includes("bloqué")) return messages.blocked
  if (normalized.includes("utilisé")) return messages.used
  if (normalized.includes("expir")) return messages.expired
  if (normalized.includes("limite")) return messages.quota
  if (normalized.includes("appartient")) return messages.tenant
  if (normalized.includes("correspond") || normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists")) {
    return "Un compte existe déjà avec cette adresse."
  }
  return "L'accès n'a pas pu être créé."
}

function bucket(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24)
}

async function manager() {
  const membership = await ensureMembership()
  const user = await getUser()
  if (!membership || !user || !can({ role: membership.role }, "team.manage")) return { error: "Permission refusée." as const }
  return { membership, user }
}

async function memberCount(organizationId: string) {
  const admin = createAdminClient()
  const { count } = await admin.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", organizationId)
  return count ?? 0
}

async function profileFor(email: string) {
  const admin = createAdminClient()
  const { data } = await admin.from("profiles").select("id, email").ilike("email", email.replace(/[%_\\]/g, "\\$&")).limit(1)
  return data?.[0] ?? null
}

async function inOtherOrganization(userId: string, organizationId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from("organization_members").select("organization_id").eq("user_id", userId)
  return (data ?? []).some((row) => row.organization_id !== organizationId)
}

async function inThisOrganization(userId: string, organizationId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from("organization_members").select("id").eq("user_id", userId).eq("organization_id", organizationId).maybeSingle()
  return Boolean(data)
}

function toInvitation(row: InvitationRow, organizationActive: boolean): AccessInvitation {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    codeHash: row.first_access_code_hash || row.token_hash,
    expiresAt: row.first_access_expires_at || row.expires_at,
    usedAt: row.first_access_used_at,
    acceptedAt: row.accepted_at,
    cancelledAt: row.cancelled_at,
    attempts: row.first_access_attempts ?? 0,
    organizationActive,
  }
}

async function loadById(id: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("organization_invitations")
    .select("id, organization_id, email, role, token_hash, first_access_code_hash, expires_at, first_access_expires_at, first_access_attempts, first_access_used_at, accepted_at, cancelled_at, invitation_type")
    .eq("id", id)
    .maybeSingle()
  if (error || !data) return null
  return data
}

async function organizationActive(organizationId: string) {
  const suspension = await activeSuspension(organizationId)
  return !suspension
}

async function enqueueAccess(input: { organizationId: string; invitationId: string; email: string; role: string; code: string; codeHash: string }) {
  let secret: Buffer
  try {
    secret = sealKey()
  } catch (error) {
    if (isIntegrationsSecretError(error)) return { queued: false as const, error: configSecretError() }
    throw error
  }
  const admin = createAdminClient()
  const { data: organization } = await admin.from("organizations").select("name, default_language").eq("id", input.organizationId).maybeSingle()
  const hours = firstAccessHours(process.env.FIRST_ACCESS_CODE_HOURS)
  return enqueueEmail({
    organizationId: input.organizationId,
    template: "first_access",
    recipient: input.email,
    locale: organization?.default_language === "en" ? "en" : "fr",
    idempotencyKey: firstAccessIdempotencyKey(input.invitationId, input.codeHash),
    payload: firstAccessEmailPayload({
      organizationName: organization?.name ?? "WOLOYEM Score",
      role: input.role,
      code: input.code,
      appUrl: getAppUrl(),
      hours,
      secret,
    }),
  })
}

async function retireAccessEmails(organizationId: string, email: string) {
  const admin = createAdminClient()
  await admin
    .from("email_jobs")
    .update({ status: "dead", last_error: "replaced" })
    .eq("organization_id", organizationId)
    .eq("recipient", email)
    .eq("template", "first_access")
    .eq("status", "pending")
}

type AccessReveal = {
  ok: true
  email: string
  role: string
  code: string
  expiresAt: string
  hours: number
  link: string
  organizationName: string
}

function revealAccess(input: { email: string; role: string; code: string; expiresAt: string; organizationName: string }): AccessReveal {
  return {
    ok: true as const,
    email: input.email,
    role: input.role,
    code: input.code,
    expiresAt: input.expiresAt,
    hours: firstAccessHours(process.env.FIRST_ACCESS_CODE_HOURS),
    link: accessLink(getAppUrl()),
    organizationName: input.organizationName,
  }
}

async function insertAccess(input: { organizationId: string; email: string; role: string; invitedBy: string }) {
  const issued = createAccessCode()
  const expires = firstAccessExpiry()
  const admin = createAdminClient()
  const { data: created, error } = await admin.from("organization_invitations").insert({
    organization_id: input.organizationId,
    email: input.email,
    role: input.role,
    token_hash: issued.hash,
    first_access_code_hash: issued.hash,
    expires_at: expires,
    first_access_expires_at: expires,
    first_access_attempts: 0,
    invitation_type: "first_access_code",
    invited_by: input.invitedBy,
  }).select("id").single()
  if (error || !created) return { error: storageError(error?.message ?? "insert") }
  const queued = await enqueueAccess({
    organizationId: input.organizationId,
    invitationId: created.id,
    email: input.email,
    role: input.role,
    code: issued.display,
    codeHash: issued.hash,
  })
  if (!queued.queued) return { error: "error" in queued && queued.error ? queued.error : "L'accès est préparé, mais l'email n'a pas pu être mis en file." }
  return { ok: true as const, code: issued.display, expiresAt: expires }
}

async function storeCode(invitationId: string, organizationId: string, email: string, role: string) {
  const issued = createAccessCode()
  const expires = firstAccessExpiry()
  const admin = createAdminClient()
  const { error } = await admin.from("organization_invitations").update({
    token_hash: issued.hash,
    first_access_code_hash: issued.hash,
    expires_at: expires,
    first_access_expires_at: expires,
    first_access_attempts: 0,
    invitation_type: "first_access_code",
    role,
  }).eq("id", invitationId).eq("organization_id", organizationId).is("accepted_at", null)
  if (error) return { error: storageError(error.message) }
  await retireAccessEmails(organizationId, email)
  const queued = await enqueueAccess({ organizationId, invitationId, email, role, code: issued.display, codeHash: issued.hash })
  if (!queued.queued) return { error: "error" in queued && queued.error ? queued.error : "L'accès est préparé, mais l'email n'a pas pu être mis en file." }
  return { ok: true as const, code: issued.display, expiresAt: expires }
}

export async function grantFirstAccess(formData: FormData): Promise<AccessReveal | { error: string }> {
  const context = await manager()
  if ("error" in context) return { error: context.error ?? "Permission refusée." }
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const role = String(formData.get("role") ?? "")
  if (!EMAIL.test(email) || !ROLES.includes(role)) return { error: "Indiquez un email et un rôle valides." }
  const organizationId = context.membership.organization.id
  if (!await organizationActive(organizationId)) return { error: messages.inactive }
  const entitlements = await loadEntitlements(organizationId)
  const limit = entitlements.limits.team_members
  if (limit !== null && await memberCount(organizationId) >= limit) return { error: messages.quota }
  if (!await allowRate(`invite:${organizationId}`, 3600, 20)) return { error: "Trop d'invitations. Réessayez plus tard." }
  const existingProfile = await profileFor(email)
  if (existingProfile && await inThisOrganization(existingProfile.id, organizationId)) return { error: "Ce membre fait déjà partie de l'équipe." }

  const admin = createAdminClient()
  const { data: pending, error: pendingError } = await admin
    .from("organization_invitations")
    .select("id, cancelled_at, accepted_at")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .eq("invitation_type", "first_access_code")
    .is("accepted_at", null)
    .is("cancelled_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
  if (pendingError) return { error: storageError(pendingError.message) }
  const current = pending?.[0]
  const issued = current
    ? await storeCode(current.id, organizationId, email, role)
    : await insertAccess({ organizationId, email, role, invitedBy: context.user.id })
  if ("error" in issued) return { error: issued.error ?? "L'accès n'a pas pu être préparé." }
  await admin.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: context.user.id,
    action: "member.first_access",
    metadata: { role },
  })
  revalidatePath("/dashboard/settings/team")
  return revealAccess({
    email,
    role,
    code: issued.code,
    expiresAt: issued.expiresAt,
    organizationName: context.membership.organization.name,
  })
}

export async function resendFirstAccess(formData: FormData): Promise<AccessReveal | { error: string }> {
  const context = await manager()
  if ("error" in context) return { error: context.error ?? "Permission refusée." }
  const id = String(formData.get("invitationId") ?? "")
  const row = await loadById(id)
  if (!row || row.organization_id !== context.membership.organization.id) return { error: "Invitation introuvable." }
  if (row.accepted_at || row.first_access_used_at) return { error: "Ce membre a déjà activé son accès." }
  if (row.cancelled_at || row.invitation_type !== "first_access_code") return { error: "Cette invitation ne peut pas être renvoyée." }
  if (!await organizationActive(row.organization_id)) return { error: messages.inactive }
  const limit = (await loadEntitlements(row.organization_id)).limits.team_members
  if (limit !== null && await memberCount(row.organization_id) >= limit) return { error: messages.quota }
  const stored = await storeCode(row.id, row.organization_id, row.email, row.role)
  if ("error" in stored) return { error: stored.error ?? "L'accès n'a pas pu être préparé." }
  await writeActivity({
    organizationId: row.organization_id,
    actorId: context.user.id,
    action: "member.first_access_regenerated",
    metadata: { role: row.role },
  })
  revalidatePath("/dashboard/settings/team")
  return revealAccess({
    email: row.email,
    role: row.role,
    code: stored.code,
    expiresAt: stored.expiresAt,
    organizationName: context.membership.organization.name,
  })
}

export async function cancelInvitation(formData: FormData) {
  const context = await manager()
  if ("error" in context) return context
  const id = String(formData.get("invitationId") ?? "")
  const row = await loadById(id)
  if (!row || row.organization_id !== context.membership.organization.id) return { error: "Invitation introuvable." }
  if (row.accepted_at) return { error: "Cette invitation est déjà acceptée." }
  const admin = createAdminClient()
  const past = new Date(0).toISOString()
  const { error } = await admin.from("organization_invitations").update({
    cancelled_at: new Date().toISOString(),
    expires_at: past,
    first_access_expires_at: past,
    token_hash: hashInviteToken(randomBytes(32).toString("base64url")),
    first_access_code_hash: hashAccessCode(randomBytes(32).toString("hex")),
  }).eq("id", row.id).eq("organization_id", row.organization_id).is("accepted_at", null)
  if (error) return { error: storageError(error.message) }
  await retireAccessEmails(row.organization_id, row.email)
  await admin.from("audit_logs").insert({
    organization_id: row.organization_id,
    actor_id: context.user.id,
    action: "member.invitation_cancelled",
    metadata: { role: row.role },
  })
  revalidatePath("/dashboard/settings/team")
  return { ok: true as const }
}

async function clientAddress() {
  const headerStore = await headers()
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "local"
}

async function rememberProof(invitationId: string) {
  let secret: Buffer
  try {
    secret = cookieKey()
  } catch (error) {
    if (isIntegrationsSecretError(error)) return false
    throw error
  }
  const jar = await cookies()
  jar.set(ACCESS_PROOF_COOKIE, sealProof(invitationId, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/first-access",
    maxAge: 15 * 60,
  })
  return true
}

async function readProof() {
  let secret: Buffer
  try {
    secret = cookieKey()
  } catch (error) {
    if (isIntegrationsSecretError(error)) return null
    throw error
  }
  const jar = await cookies()
  return openProof(jar.get(ACCESS_PROOF_COOKIE)?.value ?? "", secret)
}

async function clearProof() {
  const jar = await cookies()
  jar.set(ACCESS_PROOF_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/first-access",
    maxAge: 0,
  })
}

async function noteWrongCode(row: InvitationRow) {
  const next = (row.first_access_attempts ?? 0) + 1
  const admin = createAdminClient()
  await admin
    .from("organization_invitations")
    .update({ first_access_attempts: next })
    .eq("id", row.id)
    .eq("first_access_attempts", row.first_access_attempts ?? 0)
    .is("accepted_at", null)
  return next >= MAX_ACCESS_ATTEMPTS ? messages.blocked : messages.code
}

async function evaluate(row: InvitationRow, email: string, codeHash: string) {
  const active = await organizationActive(row.organization_id)
  const profile = await profileFor(row.email)
  const other = profile ? await inOtherOrganization(profile.id, row.organization_id) : false
  const limit = (await loadEntitlements(row.organization_id)).limits.team_members
  return decideAccessCode({
    invitation: toInvitation(row, active),
    email,
    codeHash,
    memberCount: await memberCount(row.organization_id),
    memberLimit: limit,
    alreadyInOtherOrganization: other,
  })
}

export async function verifyFirstAccess(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const code = String(formData.get("code") ?? "")
  if (!EMAIL.test(email)) return { error: "Indiquez un email valide." }
  const ip = await clientAddress()
  if (!await allowRate(`first-access-ip:${bucket(ip)}`, 900, 30)) return { error: messages.rate }
  if (!await allowRate(`first-access-email:${bucket(email)}`, 900, 8)) return { error: messages.rate }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("organization_invitations")
    .select("id, organization_id, email, role, token_hash, first_access_code_hash, expires_at, first_access_expires_at, first_access_attempts, first_access_used_at, accepted_at, cancelled_at, invitation_type")
    .eq("email", email)
    .eq("invitation_type", "first_access_code")
    .order("created_at", { ascending: false })
    .limit(5)
  if (error) return { error: storageError(error.message) }
  const codeHash = hashAccessCode(code)
  const rows = data ?? []
  const matched = rows.find((row) => !row.accepted_at && !row.cancelled_at && hashesMatch(row.first_access_code_hash || row.token_hash, codeHash))
  const pending = rows.find((row) => !row.accepted_at && !row.cancelled_at)
  const row = matched ?? pending ?? rows[0] ?? null
  if (!row) return { error: messages.missing }
  const real = await evaluate(row, email, codeHash)
  if (!real.ok) {
    if (real.reason === "code") return { error: await noteWrongCode(row) }
    return { error: messages[real.reason] }
  }
  if (!await rememberProof(row.id)) return { error: "L'accès n'a pas pu être préparé." }
  const profile = await profileFor(email)
  redirect(accountPlan(Boolean(profile)).next === "login" ? "/first-access?step=login" : "/first-access?step=password")
}

export async function firstAccessStep() {
  const proof = await readProof()
  if (!proof) return { step: "code" as const, email: "" }
  const row = await loadById(proof.invitationId)
  if (!row || row.invitation_type !== "first_access_code") return { step: "code" as const, email: "" }
  const profile = await profileFor(row.email)
  return { step: accountPlan(Boolean(profile)).next, email: row.email }
}

async function guardedInvitation() {
  const proof = await readProof()
  if (!proof) return { error: "Recommencez avec votre email et votre code." as const }
  const row = await loadById(proof.invitationId)
  if (!row || row.invitation_type !== "first_access_code") return { error: "Recommencez avec votre email et votre code." as const }
  const decision = await evaluate(row, row.email, row.first_access_code_hash || row.token_hash)
  if (!decision.ok) return { error: messages[decision.reason] as string }
  const profile = await profileFor(row.email)
  return { row, accountExists: Boolean(profile) }
}

async function finishAccess(row: InvitationRow, password: string) {
  const supabase = await createClient()
  const { error: signError } = await supabase.auth.signInWithPassword({ email: row.email, password })
  if (signError) return { error: accessError(signError.message) }
  const limit = (await loadEntitlements(row.organization_id)).limits.team_members
  const { error } = await supabase.rpc("accept_organization_invitation", {
    p_token_hash: row.token_hash,
    p_member_limit: limit,
  })
  if (error) {
    await supabase.auth.signOut()
    return { error: accessError(error.message) }
  }
  await clearProof()
  redirect("/dashboard?welcome=1")
}

export async function createAccessPassword(formData: FormData) {
  const guarded = await guardedInvitation()
  if ("error" in guarded) return guarded
  if (guarded.accountExists) return { error: "Un compte existe déjà avec cette adresse." }
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")
  const parsed = loginSchema.shape.password.safeParse(password)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." }
  if (password !== confirm) return { error: "Les mots de passe ne correspondent pas." }
  const admin = createAdminClient()
  const { error: createError } = await admin.auth.admin.createUser({
    email: guarded.row.email,
    password,
    email_confirm: true,
  })
  if (createError) return { error: accessError(createError.message) }
  return finishAccess(guarded.row, password)
}

export async function joinExistingAccess(formData: FormData) {
  const guarded = await guardedInvitation()
  if ("error" in guarded) return guarded
  if (!guarded.accountExists) return { error: "Créez votre mot de passe pour activer cet accès." }
  const password = String(formData.get("password") ?? "")
  const parsed = loginSchema.shape.password.safeParse(password)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." }
  return finishAccess(guarded.row, password)
}
