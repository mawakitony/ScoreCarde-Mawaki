import assert from "node:assert/strict"
import test from "node:test"
import { placeFilterPanel } from "./filter-panel-position.ts"

test("filter panel flips above when it would overflow the viewport bottom", () => {
  const placed = placeFilterPanel({
    button: { top: 700, left: 40, bottom: 732, right: 120 },
    viewport: { width: 390, height: 780 },
    panel: { width: 224, height: 220 },
  })
  assert.equal(placed.top < 700, true)
  assert.equal(placed.left, 40)
})

test("filter panel clamps left into the viewport on narrow screens", () => {
  const placed = placeFilterPanel({
    button: { top: 100, left: -20, bottom: 132, right: 40 },
    viewport: { width: 375, height: 800 },
    panel: { width: 224, height: 180 },
  })
  assert.equal(placed.left, 8)
})

test("filter panel keeps a usable maxHeight when flipped", () => {
  const placed = placeFilterPanel({
    button: { top: 740, left: 10, bottom: 772, right: 90 },
    viewport: { width: 375, height: 800 },
    panel: { width: 224, height: 240 },
  })
  assert.ok(placed.maxHeight >= 120)
  assert.ok(placed.top + 120 <= 800)
})
