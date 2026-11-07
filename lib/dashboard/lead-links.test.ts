import assert from "node:assert/strict"
import test from "node:test"
import { hotLeadActions, leadDetailHref } from "./lead-links.ts"

test("leadDetailHref uses real id only", () => {
  assert.equal(leadDetailHref("abc-123"), "/dashboard/leads/abc-123")
  assert.equal(leadDetailHref("  "), null)
  assert.equal(leadDetailHref(null), null)
})

test("name and eye share the same href", () => {
  const actions = hotLeadActions({ id: "lead-uuid-1", name: "Tony Assiki" })
  assert.equal(actions.href, "/dashboard/leads/lead-uuid-1")
  assert.match(actions.eyeLabel, /Tony Assiki/)
  assert.match(actions.nameLabel, /Tony Assiki/)
})
