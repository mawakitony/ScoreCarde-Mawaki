import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { hashInviteToken } from "@/lib/auth/invitations"

export const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const MAX_ACCESS_ATTEMPTS = 5
export const ACCESS_PROOF_COOKIE = "woloyem_first_access"
const PROOF_TTL_SECONDS = 15 * 60

export type AccessFailure =
  | "missing"
  | "email"
  | "code"
  | "expired"
  | "used"
  | "cancelled"
  | "blocked"
  | "inactive"
  | "quota"
  | "role"
  | "tenant"

export type AccessInvitation = {
  id: string
  email: string
  role: string
  codeHash: string
  expiresAt: string
  usedAt: string | null
  acceptedAt: string | null
  cancelledAt: string | null
  attempts: number
  organizationActive: boolean
}

export function firstAccessHours(raw: string | undefined) {
  const hours = Number(raw)
  if (!Number.isFinite(hours)) return 24
  const whole = Math.floor(hours)
  if (whole < 1) return 1
  if (whole > 168) return 168
  return whole
}

export function firstAccessExpiry(now = Date.now(), hours = firstAccessHours(process.env.FIRST_ACCESS_CODE_HOURS)) {
  return new Date(now + hours * 60 * 60 * 1000).toISOString()
}

export function normalizeAccessCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z2-9]/g, "")
}

export function hashAccessCode(code: string) {
  return hashInviteToken(normalizeAccessCode(code))
}

export function hashesMatch(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length === 0 || a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function createAccessCode(bytes = randomBytes(8)) {
  let raw = ""
  for (let index = 0; index < 8; index += 1) {
    raw += ACCESS_CODE_ALPHABET[bytes[index]! % ACCESS_CODE_ALPHABET.length]
  }
  const display = `${raw.slice(0, 4)}-${raw.slice(4)}`
  return { display, normalized: raw, hash: hashAccessCode(display) }
}

export function accessLink(appUrl: string) {
  return `${appUrl.replace(/\/$/, "")}/first-access`
}

function aesKey(material: string | Buffer) {
  if (Buffer.isBuffer(material)) {
    if (material.length !== 32) throw new Error("aes_key_invalid")
    return material
  }
  return createHash("sha256").update(material).digest()
}

export function sealSecretValue(value: string, secret: string | Buffer) {
  const key = aesKey(secret)
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`
}

export function openSecretValue(sealed: string, secret: string | Buffer) {
  if (!sealed.startsWith("enc:")) return sealed
  const [iv, tag, data] = sealed.slice(4).split(".")
  if (!iv || !tag || !data) return null
  try {
    const key = aesKey(secret)
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"))
    decipher.setAuthTag(Buffer.from(tag, "base64url"))
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8")
  } catch {
    return null
  }
}

export function firstAccessEmailPayload(input: {
  organizationName: string
  role: string
  code: string
  appUrl: string
  hours: number
  secret: string | Buffer
}) {
  return {
    organizationName: input.organizationName,
    role: input.role,
    accessCode: sealSecretValue(input.code, input.secret),
    url: accessLink(input.appUrl),
    expiresInHours: String(input.hours),
  }
}

export function firstAccessIdempotencyKey(invitationId: string, codeHash: string) {
  return `first_access:${invitationId}:${codeHash.slice(0, 12)}`
}

export function sealProof(invitationId: string, secret: string | Buffer, now = Date.now()) {
  const exp = Math.floor(now / 1000) + PROOF_TTL_SECONDS
  const body = `${invitationId}.${exp}`
  const mac = createHmac("sha256", secret).update(body).digest("base64url")
  return `${body}.${mac}`
}

export function openProof(value: string, secret: string | Buffer, now = Date.now()) {
  const [id, expRaw, mac] = value.split(".")
  if (!id || !expRaw || !mac || value.split(".").length !== 3) return null
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const exp = Number(expRaw)
  if (!Number.isFinite(exp) || exp * 1000 <= now) return null
  const expected = createHmac("sha256", secret).update(`${id}.${expRaw}`).digest("base64url")
  const left = Buffer.from(mac)
  const right = Buffer.from(expected)
  if (left.length === 0 || left.length !== right.length || !timingSafeEqual(left, right)) return null
  return { invitationId: id }
}

export function membershipRoleForInvite(role: string) {
  if (role === "admin") return { role: "admin" as const, accessRole: "admin" as const }
  if (role === "editor" || role === "analyst" || role === "viewer") return { role: "member" as const, accessRole: role }
  return null
}

export function accountPlan(accountExists: boolean) {
  if (accountExists) return { createUser: false, createOrganization: false, next: "login" as const }
  return { createUser: true, createOrganization: false, next: "password" as const }
}

export function regeneratedAccess(previousHash: string, next: { hash: string; expiresAt: string }) {
  return {
    previousUnusable: previousHash !== next.hash,
    singleActiveHash: next.hash,
    attempts: 0,
    expiresAt: next.expiresAt,
  }
}

export function decideAccessCode(input: {
  invitation: AccessInvitation | null
  email: string
  codeHash: string
  memberCount: number
  memberLimit: number | null
  alreadyInOtherOrganization?: boolean
  now?: number
}): { ok: true; invitationId: string } | { ok: false; reason: AccessFailure } {
  const invitation = input.invitation
  if (!invitation) return { ok: false, reason: "missing" }
  if (invitation.email.trim().toLowerCase() !== input.email.trim().toLowerCase()) return { ok: false, reason: "email" }
  if (invitation.cancelledAt) return { ok: false, reason: "cancelled" }
  if (invitation.acceptedAt || invitation.usedAt) return { ok: false, reason: "used" }
  const now = input.now ?? Date.now()
  const expires = new Date(invitation.expiresAt).getTime()
  if (!Number.isFinite(expires) || expires <= now) return { ok: false, reason: "expired" }
  if (invitation.attempts >= MAX_ACCESS_ATTEMPTS) return { ok: false, reason: "blocked" }
  if (!hashesMatch(invitation.codeHash, input.codeHash)) return { ok: false, reason: "code" }
  if (!invitation.organizationActive) return { ok: false, reason: "inactive" }
  if (!membershipRoleForInvite(invitation.role)) return { ok: false, reason: "role" }
  if (input.alreadyInOtherOrganization) return { ok: false, reason: "tenant" }
  if (input.memberLimit !== null && input.memberCount >= input.memberLimit) return { ok: false, reason: "quota" }
  return { ok: true, invitationId: invitation.id }
}

export function pendingInvitationStatus(input: {
  type: string | null
  expiresAt: string
  firstAccessExpiresAt?: string | null
  acceptedAt: string | null
  cancelledAt: string | null
  now?: number
}): "Invité" | "Accès non activé" | "Expiré" | null {
  if (input.acceptedAt || input.cancelledAt) return null
  const expiry = input.type === "first_access_code" ? input.firstAccessExpiresAt || input.expiresAt : input.expiresAt
  const expires = new Date(expiry).getTime()
  if (!Number.isFinite(expires) || expires <= (input.now ?? Date.now())) return "Expiré"
  return input.type === "first_access_code" ? "Accès non activé" : "Invité"
}

export function expiryDelay(hours: number) {
  return hours === 1 ? "1 heure" : `${hours} heures`
}

export function expirySentence(hours: number) {
  return `Ce code expire dans ${expiryDelay(hours)} et ne peut être utilisé qu'une seule fois.`
}

export function accessIssuedAt(expiresAt: string, hours: number) {
  const expires = new Date(expiresAt).getTime()
  if (!Number.isFinite(expires)) return null
  return new Date(expires - hours * 60 * 60 * 1000).toISOString()
}
