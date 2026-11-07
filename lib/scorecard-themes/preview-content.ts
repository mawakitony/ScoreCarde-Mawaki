import type { LandingContent } from "@/components/assessment/landing-view"
import { visualThemeById } from "./catalog"
import type { LandingThemeId } from "./types"

export function buildThemePreviewContent(themeId: string): LandingContent | null {
  const theme = visualThemeById(themeId)
  if (!theme) return null
  return {
    eyebrow: theme.defaults.eyebrow,
    title: `${theme.defaults.title}${theme.defaults.highlightText ? ` ${theme.defaults.highlightText}` : ""}`.trim(),
    subtitle: theme.defaults.subtitle,
    description: theme.defaults.description,
    heroImageUrl: "",
    ctaLabel: theme.defaults.ctaLabel,
    estimatedTimeLabel: "",
    showEstimatedTime: false,
    showQuestionCount: false,
    showPrivacy: false,
    privacyText: "",
    benefits: theme.defaults.benefits,
    testimonial: { quote: "", author: "", role: "" },
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    logoUrl: "",
    estimatedMinutes: 5,
    questionCount: 0,
    poweredBy: false,
    landingTheme: theme.id as LandingThemeId,
    highlightText: theme.defaults.highlightText,
    secondaryCtaLabel: theme.defaults.secondaryCtaLabel,
    trustLabel: theme.defaults.trustLabel,
    backgroundColor: theme.backgroundColor,
    accentColor: theme.accentColor,
    demoStats: theme.defaults.demoStats,
  }
}
