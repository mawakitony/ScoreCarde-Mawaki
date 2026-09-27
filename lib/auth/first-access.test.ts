import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { firstAccessShareMessage, whatsAppShareUrl } from "@/lib/auth/first-access-share"
import { roleAccess } from "@/lib/auth/invitation-flow"
import { renderEmail } from "@/lib/email/templates"
import { redact } from "@/lib/observability/logger"
import {
  accountPlan,
  accessIssuedAt,
  accessLink,
  createAccessCode,
  decideAccessCode,
  expirySentence,
  firstAccessEmailPayload,
  firstAccessHours,
  hashAccessCode,
  hashesMatch,
  membershipRoleForInvite,
  openProof,
  openSecretValue,
  pendingInvitationStatus,
  regeneratedAccess,
  sealProof,
  sealSecretValue,
  type AccessInvitation,
} from "@/lib/auth/first-access"

const future = new Date(Date.now() + 60_000).toISOString()
const past = new Date(Date.now() - 60_000).toISOString()

function invitation(overrides: Partial<AccessInvitation> = {}): AccessInvitation {
  const code = createAccessCode(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]))
  return {
    id: "11111111-1111-4111-8111-111111111111",
    email: "tony@example.com",
    role: "viewer",
    codeHash: code.hash,
    expiresAt: future,
    usedAt: null,
    acceptedAt: null,
    cancelledAt: null,
    attempts: 0,
    organizationActive: true,
    ...overrides,
  }
}

test("first access code is random, formatted, and stored as a hash", () => {
  const issued = createAccessCode(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]))
  assert.equal(issued.display, "ABCD-EFGH")
  assert.equal(issued.hash, hashAccessCode("abcd-efgh"))
  assert.equal(issued.hash.length, 64)
  assert.equal(issued.hash.includes(issued.display), false)
  assert.equal(hashesMatch(issued.hash, hashAccessCode("ABCD EFGH")), true)
  const other = createAccessCode()
  assert.notEqual(other.display, issued.display)
  assert.match(other.display, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/)
})

test("first access decisions reject the wrong code, email, expiry, reuse, and lockout", () => {
  const row = invitation()
  assert.equal(decideAccessCode({ invitation: null, email: "other@example.com", codeHash: row.codeHash, memberCount: 1, memberLimit: 3 }).reason, "missing")
  assert.equal(decideAccessCode({ invitation: row, email: "other@example.com", codeHash: row.codeHash, memberCount: 1, memberLimit: 3 }).reason, "email")
  assert.equal(decideAccessCode({ invitation: row, email: row.email, codeHash: hashAccessCode("ZZZZ-ZZZZ"), memberCount: 1, memberLimit: 3 }).reason, "code")
  assert.equal(decideAccessCode({ invitation: invitation({ expiresAt: past }), email: row.email, codeHash: row.codeHash, memberCount: 1, memberLimit: 3 }).reason, "expired")
  assert.equal(decideAccessCode({ invitation: invitation({ acceptedAt: future }), email: row.email, codeHash: row.codeHash, memberCount: 1, memberLimit: 3 }).reason, "used")
  assert.equal(decideAccessCode({ invitation: invitation({ usedAt: future }), email: row.email, codeHash: row.codeHash, memberCount: 1, memberLimit: 3 }).reason, "used")
  assert.equal(decideAccessCode({ invitation: invitation({ attempts: 5 }), email: row.email, codeHash: row.codeHash, memberCount: 1, memberLimit: 3 }).reason, "blocked")
  assert.equal(decideAccessCode({ invitation: invitation({ cancelledAt: future }), email: row.email, codeHash: row.codeHash, memberCount: 1, memberLimit: 3 }).reason, "cancelled")
  assert.equal(decideAccessCode({ invitation: row, email: row.email, codeHash: row.codeHash, memberCount: 3, memberLimit: 3 }).reason, "quota")
  assert.equal(decideAccessCode({ invitation: row, email: row.email, codeHash: row.codeHash, memberCount: 1, memberLimit: 3, alreadyInOtherOrganization: true }).reason, "tenant")
  assert.equal(decideAccessCode({ invitation: row, email: row.email, codeHash: row.codeHash, memberCount: 1, memberLimit: 3 }).ok, true)
})

test("regenerating a first access code invalidates the previous hash", () => {
  const first = createAccessCode(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]))
  const second = createAccessCode(Buffer.from([8, 9, 10, 11, 12, 13, 14, 15]))
  const next = regeneratedAccess(first.hash, { hash: second.hash, expiresAt: future })
  assert.equal(next.previousUnusable, true)
  assert.equal(next.singleActiveHash, second.hash)
  assert.equal(next.attempts, 0)
  assert.equal(hashesMatch(first.hash, second.hash), false)
})

test("first access creates a password on the invited account and never an organization", () => {
  assert.deepEqual(accountPlan(false), { createUser: true, createOrganization: false, next: "password" })
  assert.deepEqual(accountPlan(true), { createUser: false, createOrganization: false, next: "login" })
  assert.deepEqual(membershipRoleForInvite("viewer"), { role: "member", accessRole: "viewer" })
  assert.deepEqual(membershipRoleForInvite("editor"), { role: "member", accessRole: "editor" })
  assert.deepEqual(membershipRoleForInvite("admin"), { role: "admin", accessRole: "admin" })
  assert.equal(roleAccess("viewer").team, false)
  assert.equal(roleAccess("viewer").scorecardEdit, false)
  assert.equal(roleAccess("admin").team, true)
  assert.equal(roleAccess("editor").scorecardEdit, true)
  assert.equal(roleAccess("editor").team, false)
  const action = readFileSync(new URL("../../actions/first-access.ts", import.meta.url), "utf8")
  assert.equal(action.includes("create_organization"), false)
  assert.equal(action.includes("createUser"), true)
  assert.match(action, /email_confirm:\s*true/)
  assert.equal(action.includes("console."), false)
})

test("first access email keeps the code out of the url and out of the database payload", () => {
  const code = "7K4P-82QM"
  const payload = firstAccessEmailPayload({
    organizationName: "Acme",
    role: "editor",
    code,
    appUrl: "https://score.example",
    hours: 24,
    secret: "test-secret",
  })
  assert.equal(payload.url, "https://score.example/first-access")
  assert.equal(payload.url.includes(code), false)
  assert.equal(payload.accessCode.includes(code), false)
  assert.equal(openSecretValue(payload.accessCode, "test-secret"), code)
  const message = renderEmail({
    template: "first_access",
    locale: "fr",
    payload: { ...payload, accessCode: code },
  })
  assert.equal(message.subject, "Votre accès à WOLOYEM Score")
  assert.match(message.text, /Acme/)
  assert.match(message.text, /Editor/)
  assert.match(message.text, new RegExp(code))
  assert.match(message.text, /Créer mon accès : https:\/\/score\.example\/first-access/)
  assert.match(message.text, /Accéder à WOLOYEM Score : https:\/\/score\.example\/first-access/)
  assert.match(message.text, new RegExp(expirySentence(24)))
  assert.equal(message.text.includes("mot de passe"), false)
  assert.equal(accessLink("https://score.example/").includes(code), false)
})

test("first access codes are removed from logs and the proof cookie is not the code", () => {
  const code = createAccessCode(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]))
  const safe = redact({ code: code.display, note: `envoyé ${code.display}`, token: "raw" })
  assert.equal("code" in safe, false)
  assert.equal(safe.note, "envoyé [CODE]")
  assert.equal("token" in safe, false)
  const sealed = sealSecretValue(code.display, "test-secret")
  assert.equal(sealed.includes(code.display), false)
  assert.equal(openSecretValue(sealed, "other"), null)
  const proof = sealProof("11111111-1111-4111-8111-111111111111", "test-secret", 1_700_000_000_000)
  assert.equal(proof.includes(code.display), false)
  assert.equal(openProof(proof, "test-secret", 1_700_000_000_000)?.invitationId, "11111111-1111-4111-8111-111111111111")
  assert.equal(openProof(proof, "test-secret", 1_700_000_000_000 + 16 * 60 * 1000), null)
})

test("first access duration and invitation status stay configurable", () => {
  assert.equal(firstAccessHours(undefined), 24)
  assert.equal(firstAccessHours("1"), 1)
  assert.equal(firstAccessHours("999"), 168)
  assert.equal(pendingInvitationStatus({ type: "first_access_code", expiresAt: future, acceptedAt: null, cancelledAt: null }), "Accès non activé")
  assert.equal(pendingInvitationStatus({ type: "link", expiresAt: future, acceptedAt: null, cancelledAt: null }), "Invité")
  assert.equal(pendingInvitationStatus({ type: "first_access_code", expiresAt: past, acceptedAt: null, cancelledAt: null }), "Expiré")
  assert.equal(pendingInvitationStatus({ type: "first_access_code", expiresAt: future, acceptedAt: future, cancelledAt: null }), null)
  const sql = readFileSync(new URL("../../supabase/migrations/20260927120000_first_access.sql", import.meta.url), "utf8")
  assert.match(sql, /first_access_code_hash/)
  assert.match(sql, /first_access_attempts >= 5/)
  assert.match(sql, /cancelled_at is null/)
  assert.match(sql, /first_access_used_at/)
  assert.match(sql, /invitation_type = 'first_access_code'/)
})

test("the admin sees a first access code only in the share message, never in storage", () => {
  const code = "7K4P-82QM"
  const message = firstAccessShareMessage({
    organizationName: "Acme",
    roleLabel: "Viewer",
    code,
    appUrl: "https://score.example",
    hours: 24,
  })
  assert.match(message, /Vous avez été ajouté à Acme sur WOLOYEM Score/)
  assert.match(message, /Votre rôle : Viewer/)
  assert.match(message, new RegExp(code))
  assert.match(message, /https:\/\/score\.example\/first-access/)
  assert.match(message, new RegExp(expirySentence(24)))
  assert.equal(message.includes(`${code}/`), false)
  const whatsApp = whatsAppShareUrl(message)
  assert.equal(whatsApp.startsWith("https://wa.me/?text="), true)
  assert.equal(decodeURIComponent(whatsApp.slice("https://wa.me/?text=".length)), message)
  const issued = accessIssuedAt(new Date(1_700_000_000_000 + 24 * 60 * 60 * 1000).toISOString(), 24)
  assert.equal(issued, new Date(1_700_000_000_000).toISOString())
  const page = readFileSync(new URL("../../app/dashboard/settings/team/page.tsx", import.meta.url), "utf8")
  const panel = readFileSync(new URL("../../components/settings/team-panel.tsx", import.meta.url), "utf8")
  const action = readFileSync(new URL("../../actions/first-access.ts", import.meta.url), "utf8")
  assert.equal(page.includes("first_access_code_hash"), false)
  assert.equal(panel.includes("localStorage"), false)
  assert.equal(panel.includes("sessionStorage"), false)
  assert.match(action, /metadata: \{ role \}/)
  assert.equal(action.includes("console."), false)
  assert.equal(roleAccess("viewer").team, false)
  assert.equal(roleAccess("editor").team, false)
})
