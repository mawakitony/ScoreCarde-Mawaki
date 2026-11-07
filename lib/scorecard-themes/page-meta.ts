import type { Json } from "@/types/database"
import type { BuilderTestimonial } from "@/types/builder"
// Json used as persistence shape for scorecard_pages.testimonial
import { isLandingThemeId, type LandingThemeId, type ThemeStatCard } from "./types"

export type LandingPageMeta = {
  landingTheme: LandingThemeId
  highlightText: string
  secondaryCtaLabel: string
  trustLabel: string
  backgroundColor: string
  accentColor: string
  demoStats: ThemeStatCard[]
}

export const defaultLandingMeta = (): LandingPageMeta => ({
  landingTheme: "classic",
  highlightText: "",
  secondaryCtaLabel: "",
  trustLabel: "",
  backgroundColor: "",
  accentColor: "",
  demoStats: [],
})

export function parseLandingMeta(testimonial: Json | null | undefined, fallback: Partial<LandingPageMeta> = {}): LandingPageMeta {
  const base = { ...defaultLandingMeta(), ...fallback }
  if (!testimonial || typeof testimonial !== "object" || Array.isArray(testimonial)) return base
  const theme = typeof testimonial.landingTheme === "string" && isLandingThemeId(testimonial.landingTheme)
    ? testimonial.landingTheme
    : base.landingTheme
  return {
    landingTheme: theme,
    highlightText: typeof testimonial.highlightText === "string" ? testimonial.highlightText : base.highlightText,
    secondaryCtaLabel: typeof testimonial.secondaryCtaLabel === "string" ? testimonial.secondaryCtaLabel : base.secondaryCtaLabel,
    trustLabel: typeof testimonial.trustLabel === "string" ? testimonial.trustLabel : base.trustLabel,
    backgroundColor: typeof testimonial.backgroundColor === "string" ? testimonial.backgroundColor : base.backgroundColor,
    accentColor: typeof testimonial.accentColor === "string" ? testimonial.accentColor : base.accentColor,
    demoStats: Array.isArray(testimonial.demoStats)
      ? testimonial.demoStats.flatMap((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return []
          const label = typeof item.label === "string" ? item.label : ""
          const value = typeof item.value === "string" ? item.value : ""
          if (!label || !value) return []
          return [{
            label,
            value,
            trend: typeof item.trend === "string" ? item.trend : undefined,
            tone: typeof item.tone === "string" ? item.tone as ThemeStatCard["tone"] : undefined,
          }]
        })
      : base.demoStats,
  }
}

export function packTestimonialPayload(input: {
  testimonial: BuilderTestimonial
  meta: LandingPageMeta
}): Json | null {
  const quote = input.testimonial.quote.trim()
  const author = input.testimonial.author.trim()
  const role = input.testimonial.role.trim()
  const hasQuote = Boolean(quote)
  const hasMeta = input.meta.landingTheme !== "classic"
    || Boolean(input.meta.highlightText.trim())
    || Boolean(input.meta.secondaryCtaLabel.trim())
    || Boolean(input.meta.trustLabel.trim())
    || Boolean(input.meta.backgroundColor.trim())
    || Boolean(input.meta.accentColor.trim())
    || input.meta.demoStats.length > 0
  if (!hasQuote && !hasMeta) return null
  return {
    quote,
    author,
    role,
    landingTheme: input.meta.landingTheme,
    highlightText: input.meta.highlightText,
    secondaryCtaLabel: input.meta.secondaryCtaLabel,
    trustLabel: input.meta.trustLabel,
    backgroundColor: input.meta.backgroundColor,
    accentColor: input.meta.accentColor,
    demoStats: input.meta.demoStats,
  }
}
