import { canonicalUrl, normalizeDomain, type DomainStatus } from "@/lib/billing/domains"
import { whatsAppShareUrl } from "@/lib/auth/first-access-share"

export const SHARE_BLOCKED = "Publiez cette scorecard avant de la partager."

export type ShareDomain = {
  domain: string
  organizationId: string
  status: DomainStatus | string
}

export function scorecardShareMessage(input: { name: string; url: string }) {
  return `Découvrez ${input.name} sur WOLOYEM Score :\n${input.url}`
}

export function scorecardMailto(input: { name: string; url: string }) {
  const subject = `Découvrez ${input.name} sur WOLOYEM Score`
  const body = `${scorecardShareMessage(input)}`
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function qrDownloadName(slug: string) {
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "").slice(0, 80) || "scorecard"
  return `woloyem-score-${safe}-qr.png`
}

export function scorecardShareTarget(input: {
  appUrl: string
  slug: string
  name: string
  status: string
  organizationId: string
  domain: ShareDomain | null
}) {
  if (input.status !== "published") return { shareable: false as const, message: SHARE_BLOCKED }
  const platform = `${input.appUrl.replace(/\/$/, "")}/s/${input.slug}`
  const domain = input.domain
  const hostname = domain && domain.status === "verified" && domain.organizationId === input.organizationId
    ? normalizeDomain(domain.domain)
    : null
  const url = hostname
    ? canonicalUrl({ appUrl: input.appUrl, host: hostname, slug: input.slug, customDomain: true })
    : platform
  return {
    shareable: true as const,
    name: input.name,
    slug: input.slug,
    url,
    message: scorecardShareMessage({ name: input.name, url }),
    whatsApp: whatsAppShareUrl(scorecardShareMessage({ name: input.name, url })),
    mailto: scorecardMailto({ name: input.name, url }),
    fileName: qrDownloadName(input.slug),
  }
}
