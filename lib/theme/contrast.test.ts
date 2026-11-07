import assert from "node:assert/strict"
import test from "node:test"

function luminance(hex: string) {
  const value = hex.replace("#", "")
  const rgb = [0, 1, 2].map((i) => {
    const channel = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!
}

function contrast(foreground: string, background: string) {
  const a = luminance(foreground)
  const b = luminance(background)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

test("Lot 17B restored dark muted text meets WCAG AA on card and canvas", () => {
  assert.ok(contrast("#c5d0de", "#152238") >= 4.5)
  assert.ok(contrast("#c5d0de", "#0b1220") >= 4.5)
  assert.ok(contrast("#f2f5fa", "#152238") >= 4.5)
  assert.ok(contrast("#f2f5fa", "#101b2d") >= 4.5)
})

test("Lot 17/17A light Ultramarine titles and muted text meet WCAG AA", () => {
  assert.ok(contrast("#071039", "#ffffff") >= 4.5)
  assert.ok(contrast("#071039", "#f7f8fc") >= 4.5)
  assert.ok(contrast("#3d4f7a", "#ffffff") >= 4.5)
  assert.ok(contrast("#ffffff", "#2e5de6") >= 4.5)
})

test("Lot 17 ultramarine primary on ice and white (Light)", () => {
  assert.ok(contrast("#2e5de6", "#e6edfd") >= 3)
  assert.ok(contrast("#0f2270", "#e6edfd") >= 4.5)
})

test("Lot 17A accent labels use brand-700 (not pastel) on light", () => {
  assert.ok(contrast("#1a3bb0", "#f7f8fc") >= 4.5)
  assert.ok(contrast("#1a3bb0", "#ffffff") >= 4.5)
  assert.ok(contrast("#6e92f2", "#ffffff") < 4.5)
})
