export const LANDING_THEME_IDS = [
  "classic",
  "digital-experience",
  "express-delivery",
  "analytics-cloud",
  "business-growth",
  "workflow-minimal",
  "ai-copilot",
  "fintech-elegant",
] as const

export type LandingThemeId = (typeof LANDING_THEME_IDS)[number]

export type ThemeStatCard = {
  label: string
  value: string
  trend?: string
  tone?: "blue" | "red" | "purple" | "orange" | "green" | "teal"
}

export type VisualThemeDefinition = {
  id: Exclude<LandingThemeId, "classic">
  name: string
  category: string
  description: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  defaults: {
    eyebrow: string
    title: string
    highlightText: string
    subtitle: string
    description: string
    ctaLabel: string
    secondaryCtaLabel: string
    trustLabel: string
    benefits: { title: string; description: string; icon: string }[]
    demoStats: ThemeStatCard[]
  }
}

export function isLandingThemeId(value: string | null | undefined): value is LandingThemeId {
  return Boolean(value && (LANDING_THEME_IDS as readonly string[]).includes(value))
}
