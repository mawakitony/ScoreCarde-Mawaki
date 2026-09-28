import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { membershipRoleForInvite } from "./first-access.ts"
import { can, canChangeMemberRole, memberRoleAuditEntry, rolesAfterTransfer } from "./permissions.ts"

test("only the owner can assign an existing member a non-owner role", () => {
  assert.equal(canChangeMemberRole({ callerRole: "owner", targetRole: "viewer", nextRole: "editor", sameOrganization: true }), true)
  assert.equal(can({ role: "editor" }, "scorecard.edit"), true)
  assert.equal(can({ role: "editor" }, "billing.manage"), false)
  assert.equal(can({ role: "editor" }, "billing.view"), false)
  assert.equal(can({ role: "editor" }, "team.manage"), false)
  assert.equal(canChangeMemberRole({ callerRole: "owner", targetRole: "editor", nextRole: "viewer", sameOrganization: true }), true)
  assert.equal(can({ role: "viewer" }, "scorecard.edit"), false)
  assert.equal(can({ role: "viewer" }, "team.manage"), false)
  assert.equal(canChangeMemberRole({ callerRole: "admin", targetRole: "viewer", nextRole: "editor", sameOrganization: true }), false)
  assert.equal(canChangeMemberRole({ callerRole: "editor", targetRole: "viewer", nextRole: "analyst", sameOrganization: true }), false)
  assert.equal(canChangeMemberRole({ callerRole: "owner", targetRole: "viewer", nextRole: "admin", sameOrganization: false }), false)
  assert.equal(canChangeMemberRole({ callerRole: "owner", targetRole: "owner", nextRole: "admin", sameOrganization: true }), false)
  assert.equal(canChangeMemberRole({ callerRole: "owner", targetRole: "editor", nextRole: "owner", sameOrganization: true }), false)
  assert.equal(canChangeMemberRole({ callerRole: "owner", targetRole: "editor", nextRole: "member", sameOrganization: true }), false)
  assert.equal(canChangeMemberRole({ callerRole: "owner", targetRole: "editor", nextRole: "editor", sameOrganization: true }), false)
  assert.deepEqual(rolesAfterTransfer({ callerId: "owner-id", targetId: "member-id", callerRole: "owner" }), { "member-id": "owner", "owner-id": "admin" })
  assert.equal(rolesAfterTransfer({ callerId: "admin-id", targetId: "member-id", callerRole: "admin" }), null)
  assert.deepEqual(membershipRoleForInvite("editor"), { role: "member", accessRole: "editor" })
  assert.deepEqual(membershipRoleForInvite("viewer"), { role: "member", accessRole: "viewer" })
  assert.deepEqual(membershipRoleForInvite("admin"), { role: "admin", accessRole: "admin" })
  assert.equal(membershipRoleForInvite("owner"), null)
})

test("a role change is audited without contact details", () => {
  const entry = memberRoleAuditEntry({
    organizationId: "org-1",
    actorUserId: "actor-1",
    targetUserId: "target-1",
    oldRole: "viewer",
    newRole: "editor",
  })
  assert.equal(entry.action, "member.role_changed")
  assert.equal(entry.organization_id, "org-1")
  assert.equal(entry.actor_id, "actor-1")
  assert.deepEqual(entry.metadata, {
    actor_user_id: "actor-1",
    target_user_id: "target-1",
    old_role: "viewer",
    new_role: "editor",
  })
  assert.equal(JSON.stringify(entry).includes("email"), false)
  assert.equal(JSON.stringify(entry).includes("password"), false)
  const action = readFileSync(new URL("../../actions/member-role.ts", import.meta.url), "utf8")
  const page = readFileSync(new URL("../../app/dashboard/settings/team/page.tsx", import.meta.url), "utf8")
  assert.match(action, /canChangeMemberRole/)
  assert.match(action, /membership\.organization\.id/)
  assert.equal(action.includes("formData.get(\"organization"), false)
  assert.equal(action.includes("console."), false)
  assert.match(page, /membership\.role === "owner"/)
  assert.equal(page.includes("first_access_code_hash"), false)
})
