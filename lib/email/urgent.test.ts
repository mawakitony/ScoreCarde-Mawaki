import assert from "node:assert/strict"
import test from "node:test"
import { isUrgentEmailTemplate, URGENT_EMAIL_TEMPLATES } from "./urgent.ts"

test("urgent templates are first_access and support_notice only", () => {
  assert.deepEqual([...URGENT_EMAIL_TEMPLATES].sort(), ["first_access", "support_notice"].sort())
  assert.equal(isUrgentEmailTemplate("first_access"), true)
  assert.equal(isUrgentEmailTemplate("support_notice"), true)
  assert.equal(isUrgentEmailTemplate("trial_ending_j0"), false)
  assert.equal(isUrgentEmailTemplate("trial_ending"), false)
  assert.equal(isUrgentEmailTemplate("organization_invitation"), false)
})
