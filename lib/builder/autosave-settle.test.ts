import assert from "node:assert/strict"
import test from "node:test"
import { settleAutosave } from "./autosave-settle.ts"

test("settleAutosave marks success when save resolves cleanly", async () => {
  const settled = await settleAutosave(async () => ({}))
  assert.deepEqual(settled, { ok: true })
})

test("settleAutosave surfaces returned errors without hanging on saving", async () => {
  const settled = await settleAutosave(async () => ({ error: "quota", quiet: true }))
  assert.equal(settled.ok, false)
  if (settled.ok) throw new Error("expected failure")
  assert.equal(settled.error, "quota")
  assert.equal(settled.quiet, true)
})

test("settleAutosave converts thrown errors to a failed settle", async () => {
  const settled = await settleAutosave(async () => {
    throw new Error("network down")
  })
  assert.equal(settled.ok, false)
  if (settled.ok) throw new Error("expected failure")
  assert.match(settled.error ?? "", /Impossible d'enregistrer/)
})
