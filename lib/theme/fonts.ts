/** Product typography tokens — Poppins is the default UI family. */
export const PRODUCT_FONT_FAMILY = "Poppins"
export const PRODUCT_FONT_CSS_VAR = "--font-poppins"

export const LEGACY_UI_FONTS = ["Manrope", "Fraunces"] as const

/** True when a computed font-family stack includes Poppins (not only a fallback). */
export function fontStackIncludesPoppins(fontFamily: string | null | undefined) {
  if (!fontFamily) return false
  return /\bpoppins\b/i.test(fontFamily)
}

/** True when a computed stack still leans on a removed UI face. */
export function fontStackUsesLegacyUiFont(fontFamily: string | null | undefined) {
  if (!fontFamily) return false
  return LEGACY_UI_FONTS.some((name) => new RegExp(`\\b${name}\\b`, "i").test(fontFamily))
}
