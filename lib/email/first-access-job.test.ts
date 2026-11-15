import assert from "node:assert/strict"
import test from "node:test"
import {
  FIRST_ACCESS_OBSOLETE_USED,
  invitationIdFromFirstAccessIdempotencyKey,
  isFirstAccessInvitationUsed,
} from "./first-access-job.ts"

test("parses invitation id from first_access idempotency key", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000"
  assert.equal(
    invitationIdFromFirstAccessIdempotencyKey(`first_access:${id}:abcdef012345`),
    id,
  )
  assert.equal(invitationIdFromFirstAccessIdempotencyKey("support_notice:x"), null)
  assert.equal(invitationIdFromFirstAccessIdempotencyKey(""), null)
})

test("invitation used when first_access_used_at or accepted_at is set", () => {
  assert.equal(isFirstAccessInvitationUsed(null), false)
  assert.equal(isFirstAccessInvitationUsed({ first_access_used_at: null, accepted_at: null }), false)
  assert.equal(isFirstAccessInvitationUsed({ first_access_used_at: "2026-01-01T00:00:00Z", accepted_at: null }), true)
  assert.equal(isFirstAccessInvitationUsed({ first_access_used_at: null, accepted_at: "2026-01-01T00:00:00Z" }), true)
  assert.equal(FIRST_ACCESS_OBSOLETE_USED, "obsolete_invitation_used")
})
