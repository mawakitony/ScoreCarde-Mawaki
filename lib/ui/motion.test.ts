import assert from "node:assert/strict"
import test from "node:test"
import {
  MOTION_CARD_LIFT,
  MOTION_COLOR,
  MOTION_DURATION,
  MOTION_ENTER,
  MOTION_INTERACTIVE,
  MOTION_PRESS,
  enterDelayMs,
  scrollBehavior,
  shouldStagger,
} from "./motion.ts"

test("motion durations map to the Lot 16I scale", () => {
  assert.equal(MOTION_DURATION.instant, "duration-100")
  assert.equal(MOTION_DURATION.fast, "duration-150")
  assert.equal(MOTION_DURATION.normal, "duration-200")
  assert.equal(MOTION_DURATION.panel, "duration-300")
})

test("interactive tokens stay transform/opacity friendly", () => {
  assert.match(MOTION_INTERACTIVE, /motion-safe:transition-/)
  assert.match(MOTION_CARD_LIFT, /hover:-translate-y/)
  assert.match(MOTION_COLOR, /transition-colors/)
  assert.equal(MOTION_PRESS, "motion-safe:active:scale-[0.98]")
  assert.equal(MOTION_ENTER, "ws-enter")
})

test("scroll behavior respects reduced motion", () => {
  assert.equal(scrollBehavior(true), "auto")
  assert.equal(scrollBehavior(false), "smooth")
})

test("stagger delays are capped for long lists", () => {
  assert.equal(enterDelayMs(0), 0)
  assert.equal(enterDelayMs(3), 120)
  assert.equal(enterDelayMs(40), 240)
  assert.equal(shouldStagger(true), false)
  assert.equal(shouldStagger(false), true)
})
