import { notFound } from "next/navigation"
import { LandingView } from "@/components/assessment/landing-view"
import { DevicePreviewStage } from "@/components/templates/device-preview-stage"
import { buildThemePreviewContent } from "@/lib/scorecard-themes/preview-content"
import { visualThemeById } from "@/lib/scorecard-themes/catalog"

export const metadata = { title: "Aperçu modèle", robots: { index: false, follow: false } }

export default async function ThemePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ themeId: string }>
  searchParams: Promise<{ frame?: string }>
}) {
  const { themeId } = await params
  const { frame } = await searchParams
  if (!visualThemeById(themeId)) notFound()
  const content = buildThemePreviewContent(themeId)
  if (!content) notFound()

  const landing = <LandingView content={content} ctaHref="#" />

  // ?frame=mobile → 390px viewport centered (for Playwright / review). Default = full-bleed page.
  if (frame === "mobile") {
    return (
      <main className="min-h-screen bg-muted/50">
        <DevicePreviewStage device="mobile" className="min-h-screen">
          {landing}
        </DevicePreviewStage>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full bg-white">
      {landing}
    </main>
  )
}
