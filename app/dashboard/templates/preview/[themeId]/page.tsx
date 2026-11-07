import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { DevicePreviewStage, type PreviewDevice } from "@/components/templates/device-preview-stage"
import { UseVisualThemeButton } from "@/components/templates/use-visual-theme-button"
import { can } from "@/lib/auth/permissions"
import { ensureMembership } from "@/lib/data/membership"
import { visualThemeById } from "@/lib/scorecard-themes/catalog"
import { WS_FOCUS, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export const metadata = { title: "Aperçu modèle", robots: { index: false, follow: false } }

const DEVICE_OPTIONS: { id: PreviewDevice; label: string; hint: string }[] = [
  { id: "desktop", label: "Desktop", hint: "Mac" },
  { id: "tablet", label: "Tablette", hint: "iPad" },
  { id: "mobile", label: "Mobile", hint: "iPhone 18 Pro" },
]

/**
 * Dedicated authenticated gallery preview.
 * Theme content loads in an iframe; hardware chrome is Mac / iPad / iPhone 18 Pro.
 */
export default async function TemplatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ themeId: string }>
  searchParams: Promise<{ device?: string }>
}) {
  const membership = await ensureMembership()
  if (!membership) return null

  const { themeId } = await params
  const { device: deviceParam } = await searchParams
  const theme = visualThemeById(themeId)
  if (!theme) notFound()

  const device: PreviewDevice =
    deviceParam === "mobile" ? "mobile" : deviceParam === "tablet" ? "tablet" : "desktop"
  const canCreate = can({ role: membership.role }, "scorecard.edit")
  // Always load the bare theme page — device chrome lives only on this outer stage
  // (avoids nested iPhone/iPad/Mac frames when ?frame=mobile is used elsewhere).
  const frameSrc = `/theme-preview/${theme.id}`
  const iframeHeight =
    device === "mobile"
      ? "h-[min(74vh,780px)]"
      : device === "tablet"
        ? "h-[min(72vh,820px)]"
        : "h-[min(70vh,760px)]"

  return (
    <div className="space-y-4">
      <header className={cn(WS_PANEL, "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5")}>
        <div className="min-w-0">
          <Link href="/dashboard/templates" className={cn("inline-flex items-center gap-1.5 text-[13px]", WS_LINK)}>
            <ArrowLeft className="size-3.5" aria-hidden />
            Bibliothèque de modèles
          </Link>
          <p className="mt-2 text-[10px] font-semibold tracking-[0.14em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
            {theme.category}
          </p>
          <h1 className="mt-1 text-[1.25rem] font-semibold tracking-tight text-foreground">{theme.name}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{theme.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-muted/40 p-1" role="group" aria-label="Format d'aperçu">
            {DEVICE_OPTIONS.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/templates/preview/${theme.id}?device=${item.id}`}
                aria-current={device === item.id ? "page" : undefined}
                title={item.hint}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                  WS_FOCUS,
                  device === item.id
                    ? "bg-[color:var(--brand-950)] text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="sm:hidden">{item.hint}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
          <Link
            href={frameSrc}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-[12px] font-semibold",
              "hover:bg-muted/60",
              WS_FOCUS,
            )}
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Page complète
          </Link>
          {canCreate ? <UseVisualThemeButton themeId={theme.id} /> : null}
        </div>
      </header>

      <div className={cn(WS_PANEL, "overflow-x-auto overflow-y-hidden bg-muted/30")}>
        <DevicePreviewStage device={device} className="min-h-[min(88vh,960px)] bg-transparent dark:bg-transparent">
          <iframe
            key={device}
            title={`Aperçu ${device} ${theme.name}`}
            src={frameSrc}
            className={cn("block w-full border-0 bg-white", iframeHeight)}
          />
        </DevicePreviewStage>
      </div>
    </div>
  )
}
