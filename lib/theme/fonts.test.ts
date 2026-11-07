import assert from "node:assert/strict"
import test from "node:test"
import { fontStackIncludesPoppins, fontStackUsesLegacyUiFont, PRODUCT_FONT_FAMILY } from "./fonts.ts"

test("product default font is Poppins", () => {
  assert.equal(PRODUCT_FONT_FAMILY, "Poppins")
})

test("detects Poppins in computed font stacks", () => {
  assert.equal(fontStackIncludesPoppins('Poppins, ui-sans-serif, system-ui, sans-serif'), true)
  assert.equal(fontStackIncludesPoppins('"Poppins", Arial, sans-serif'), true)
  assert.equal(fontStackIncludesPoppins("Manrope, system-ui"), false)
})

test("detects legacy Manrope/Fraunces stacks", () => {
  assert.equal(fontStackUsesLegacyUiFont("Manrope, system-ui"), true)
  assert.equal(fontStackUsesLegacyUiFont("Fraunces, Georgia, serif"), true)
  assert.equal(fontStackUsesLegacyUiFont("Poppins, system-ui"), false)
})
