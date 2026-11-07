import assert from "node:assert/strict"
import test from "node:test"
import { ambientMotionClass, shouldAnimateNumbers } from "./motion.ts"

test("reduced motion disables KPI number animation", () => {
  assert.equal(shouldAnimateNumbers(true), false)
  assert.equal(shouldAnimateNumbers(false), true)
})

test("ambient motion pauses when reduced or tab hidden", () => {
  assert.equal(ambientMotionClass({ prefersReducedMotion: true, tabHidden: false }), "dash-motion-paused")
  assert.equal(ambientMotionClass({ prefersReducedMotion: false, tabHidden: true }), "dash-motion-paused")
  assert.equal(ambientMotionClass({ prefersReducedMotion: false, tabHidden: false }), "")
})
