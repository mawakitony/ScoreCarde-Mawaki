import assert from "node:assert/strict"
import test from "node:test"
import { leadAvatarSeed, leadAvatarTone } from "./avatar.ts"

test("leadAvatarTone is stable for the same seed", () => {
  assert.equal(leadAvatarTone("tony assiki"), leadAvatarTone("tony assiki"))
  assert.notEqual(leadAvatarTone("tony"), leadAvatarTone("agoe"))
})

test("leadAvatarSeed prefers name then email then id", () => {
  assert.equal(leadAvatarSeed("Ada Lovelace", "ada@example.com", "id"), "ada lovelace")
  assert.equal(leadAvatarSeed("  ", "ada@example.com", "id"), "ada@example.com")
  assert.equal(leadAvatarSeed(null, null, "abc"), "abc")
})
