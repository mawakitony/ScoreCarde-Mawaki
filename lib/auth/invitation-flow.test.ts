import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { selectCurrentMember } from "../data/current-member.ts"
import { safeNextPath } from "../env.ts"
import { redact } from "../observability/logger.ts"
import {
  acceptanceDecision,
  accountEntry,
  classifyInvitation,
  emailsMatch,
  inviteReturnPath,
  keepsAuthenticatedInviteSession,
  maskEmail,
  roleAccess,
  type InvitationFacts,
} from "./invitation-flow.ts"

const now = Date.parse("2026-09-27T09:00:00.000Z")
const orgId = "org-1"
const ownerId = "user-owner"
const viewerId = "user-viewer"
const editorId = "user-editor"

const rows = [
  { userId: ownerId, organizationId: orgId, role: "owner", accessRole: "owner" },
  { userId: viewerId, organizationId: orgId, role: "member", accessRole: "viewer" },
  { userId: editorId, organizationId: orgId, role: "member", accessRole: "editor" },
]

function facts(overrides: Partial<InvitationFacts> = {}): InvitationFacts {
  return {
    email: "email-test@example.com",
    role: "viewer",
    acceptedAt: null,
    expiresAt: "2026-10-04T09:00:00.000Z",
    organizationId: orgId,
    organizationName: "E2E Org",
    inviterName: "Tony",
    ...overrides,
  }
}

test("current membership is filtered by user and organization", () => {
  const source = readFileSync(new URL("../data/membership.ts", import.meta.url), "utf8")
  assert.equal(source.includes("getCurrentMembership"), true)
  assert.equal(source.includes('.eq("user_id"'), true)
  assert.equal(source.includes('.eq("organization_id"'), true)
  assert.equal(source.includes(".limit(1)"), false)
  assert.equal(selectCurrentMember(rows, viewerId, orgId)?.accessRole, "viewer")
  assert.equal(selectCurrentMember(rows, viewerId, "other-org"), null)
  assert.equal(selectCurrentMember(rows, "missing", orgId), null)
})

test("viewer and editor never receive the owner row", () => {
  assert.equal(selectCurrentMember(rows, viewerId, orgId)?.role, "member")
  assert.notEqual(selectCurrentMember(rows, viewerId, orgId)?.accessRole, "owner")
  assert.equal(selectCurrentMember(rows, editorId, orgId)?.accessRole, "editor")
  assert.notEqual(selectCurrentMember(rows, editorId, orgId)?.accessRole, "owner")
})

test("invited signup stays signed in without creating an organization", () => {
  const nextPath = inviteReturnPath("abcdefghijklmnopqrstuvwxyz012345")
  assert.equal(keepsAuthenticatedInviteSession({ nextPath, invitationStatus: "valid" }), true)
  assert.equal(keepsAuthenticatedInviteSession({ nextPath, invitationStatus: "expired" }), false)
  const entry = accountEntry({ nextPath, invitationStatus: "valid", hasMembership: false })
  assert.equal(entry.signOut, false)
  assert.equal(entry.createOrganization, false)
  assert.equal(entry.destination, nextPath)
  assert.equal(accountEntry({ nextPath: "/dashboard", invitationStatus: "invalid", hasMembership: false }).createOrganization, false)
})

test("returnTo keeps only an invite path", () => {
  const path = inviteReturnPath("abcdefghijklmnopqrstuvwxyz012345")
  assert.equal(safeNextPath(path), path)
  assert.equal(safeNextPath("/dashboard/settings"), "/dashboard/settings")
  assert.equal(safeNextPath("//evil.example/invite/abcdefghijklmnopqrstuvwxyz012345"), "/dashboard")
  assert.equal(safeNextPath("/invite/short"), "/dashboard")
  assert.equal(safeNextPath("/invite/abcdefghijklmnopqrstuvwxyz012345/extra"), "/dashboard")
  assert.equal(redact({ path }).path, "/invite/[REDACTED]")
})

test("acceptance creates the membership only when the invitation can be consumed", () => {
  const accepted = acceptanceDecision({
    status: "valid",
    emailMatches: true,
    alreadyInOtherOrganization: false,
    memberCount: 1,
    memberLimit: 3,
  })
  assert.equal(accepted.ok, true)
  assert.equal(accepted.createMembership, true)
  assert.equal(accepted.markAccepted, true)
})

test("wrong email, expired token, reused token, quota, and cross-tenant stay unconsumed", () => {
  const blocked = [
    acceptanceDecision({ status: "valid", emailMatches: false, alreadyInOtherOrganization: false, memberCount: 1, memberLimit: 3 }),
    acceptanceDecision({ status: "expired", emailMatches: true, alreadyInOtherOrganization: false, memberCount: 1, memberLimit: 3 }),
    acceptanceDecision({ status: "used", emailMatches: true, alreadyInOtherOrganization: false, memberCount: 1, memberLimit: 3 }),
    acceptanceDecision({ status: "valid", emailMatches: true, alreadyInOtherOrganization: false, memberCount: 3, memberLimit: 3 }),
    acceptanceDecision({ status: "valid", emailMatches: true, alreadyInOtherOrganization: true, memberCount: 1, memberLimit: 3 }),
  ]
  assert.deepEqual(blocked.map((item) => item.reason), ["email", "expired", "used", "quota", "tenant"])
  assert.equal(blocked.every((item) => item.createMembership === false && item.markAccepted === false), true)
  const view = classifyInvitation(facts({ acceptedAt: now.toString() }), now)
  assert.equal(view.status, "used")
  assert.equal(classifyInvitation(facts({ expiresAt: "2026-09-01T00:00:00.000Z" }), now).status, "expired")
  assert.equal(classifyInvitation(null).status, "invalid")
  assert.equal(emailsMatch("A@Example.com", "a@example.com"), true)
  assert.equal(maskEmail("email-test@example.com"), "e***@example.com")
})

test("ui permissions match the server role matrix", () => {
  const viewer = roleAccess("viewer")
  assert.equal(viewer.dashboard && viewer.read, true)
  assert.equal(viewer.invite || viewer.billingManage || viewer.billingView || viewer.scorecardEdit, false)
  const analyst = roleAccess("analyst")
  assert.equal(analyst.read && analyst.leadRead && analyst.leadExport, true)
  assert.equal(analyst.scorecardEdit || analyst.team || analyst.billingManage, false)
  assert.equal(analyst.billingView, true)
  const editor = roleAccess("editor")
  assert.equal(editor.scorecardEdit, true)
  assert.equal(editor.billingView || editor.billingManage || editor.team, false)
  const admin = roleAccess("admin")
  assert.equal(admin.scorecardEdit && admin.team && admin.integrations, true)
  assert.equal(admin.billingManage || admin.transferOwnership || admin.deleteOrganization, false)
  const owner = roleAccess("owner")
  assert.equal(owner.billingManage && owner.transferOwnership && owner.invite && owner.scorecardEdit, true)
})
