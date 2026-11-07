import assert from "node:assert/strict"
import test from "node:test"
import {
  AUTH_SCENES,
  clampAuthSceneIndex,
  nextAuthSceneIndex,
  shouldAutoAdvanceScenes,
} from "./motion-scenes.ts"

test("auth showcase has three illustrative scenes", () => {
  assert.equal(AUTH_SCENES.length, 3)
  assert.equal(AUTH_SCENES[0]!.id, "scorecards")
  assert.equal(AUTH_SCENES[1]!.id, "leads")
  assert.equal(AUTH_SCENES[2]!.id, "analytics")
  assert.equal(AUTH_SCENES[2]!.title.includes("temps réel"), false)
  assert.match(AUTH_SCENES[0]!.title, /valeur/i)
})

test("scene index wraps without inventing indices", () => {
  assert.equal(nextAuthSceneIndex(2), 0)
  assert.equal(clampAuthSceneIndex(-1), 2)
  assert.equal(clampAuthSceneIndex(5), 2)
})

test("auto-advance respects reduced motion, hidden tab and pause", () => {
  assert.equal(shouldAutoAdvanceScenes({ prefersReducedMotion: false, tabHidden: false, paused: false }), true)
  assert.equal(shouldAutoAdvanceScenes({ prefersReducedMotion: true, tabHidden: false, paused: false }), false)
  assert.equal(shouldAutoAdvanceScenes({ prefersReducedMotion: false, tabHidden: true, paused: false }), false)
  assert.equal(shouldAutoAdvanceScenes({ prefersReducedMotion: false, tabHidden: false, paused: true }), false)
})
