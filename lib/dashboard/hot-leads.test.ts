import assert from "node:assert/strict"
import test from "node:test"
import { leadAvatarSeed } from "../leads/avatar.ts"

test("hot lead avatars fall back to initials seed without inventing photos", () => {
  const seed = leadAvatarSeed("Ada Lovelace", null, "lead-1")
  assert.equal(seed, "ada lovelace")
  // No email in analytics hot_leads payload — UI must not fabricate one.
  assert.equal(leadAvatarSeed("Ada Lovelace", undefined, "lead-1"), "ada lovelace")
})
