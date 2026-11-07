import assert from "node:assert/strict"
import test from "node:test"
import { VISUAL_THEMES, visualThemeById } from "./catalog.ts"
import { isLandingThemeId } from "./types.ts"
import { packTestimonialPayload, parseLandingMeta } from "./page-meta.ts"

test("seven premium visual themes are registered with stable ids", () => {
  assert.equal(VISUAL_THEMES.length, 7)
  for (const theme of VISUAL_THEMES) {
    assert.equal(isLandingThemeId(theme.id), true)
    assert.ok(theme.defaults.title.length >= 2)
    assert.ok(theme.primaryColor.startsWith("#"))
    assert.equal(visualThemeById(theme.id)?.name, theme.name)
  }
})

test("landing meta packs and parses without mutating classic defaults", () => {
  const packed = packTestimonialPayload({
    testimonial: { quote: "", author: "", role: "" },
    meta: {
      landingTheme: "digital-experience",
      highlightText: "résultats",
      secondaryCtaLabel: "Démo",
      trustLabel: "Exemples",
      backgroundColor: "#F7F5FC",
      accentColor: "#6366F1",
      demoStats: [{ label: "Exemple", value: "98%", tone: "blue" }],
    },
  })
  assert.ok(packed)
  const meta = parseLandingMeta(packed)
  assert.equal(meta.landingTheme, "digital-experience")
  assert.equal(meta.highlightText, "résultats")
  assert.equal(meta.demoStats[0]?.value, "98%")
  assert.equal(packTestimonialPayload({
    testimonial: { quote: "", author: "", role: "" },
    meta: {
      landingTheme: "classic",
      highlightText: "",
      secondaryCtaLabel: "",
      trustLabel: "",
      backgroundColor: "",
      accentColor: "",
      demoStats: [],
    },
  }), null)
})
