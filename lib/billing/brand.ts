import { hasFeature, type ResolvedEntitlements } from "./entitlements"

export const WOLOYEM_BRAND = {
  name: "Mawaki Score",
  primaryColor: "#1c2340",
  secondaryColor: "#60a5fa",
  logoUrl: "",
}

export function resolvePublicBrand(input: {
  entitlements: ResolvedEntitlements
  organization: { name: string; logoUrl: string | null; primaryColor: string; secondaryColor: string; footerText?: string | null }
  scorecard: { logoUrl: string | null; primaryColor: string; secondaryColor: string }
}) {
  const custom = hasFeature(input.entitlements, "custom_branding")
  const poweredBy = !hasFeature(input.entitlements, "remove_powered_by")
  if (!custom) {
    return { ...WOLOYEM_BRAND, logoUrl: "", footerText: "", poweredBy: true }
  }
  return {
    name: input.organization.name,
    primaryColor: input.scorecard.primaryColor || input.organization.primaryColor || WOLOYEM_BRAND.primaryColor,
    secondaryColor: input.scorecard.secondaryColor || input.organization.secondaryColor || WOLOYEM_BRAND.secondaryColor,
    logoUrl: input.scorecard.logoUrl || input.organization.logoUrl || "",
    footerText: input.organization.footerText ?? "",
    poweredBy,
  }
}
