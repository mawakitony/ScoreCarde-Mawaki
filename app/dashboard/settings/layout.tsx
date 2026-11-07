import { Settings2 } from "lucide-react"
import { SettingsNav } from "@/components/settings/settings-nav"
import { WS_ICON_CHIP, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <header className={cn(WS_PANEL, "p-5 md:p-6")}>
        <div className="flex items-start gap-3">
          <span className={cn(WS_ICON_CHIP, "size-11 rounded-2xl")}>
            <Settings2 className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground md:text-[1.5rem]">
              Paramètres
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Compte, organisation, équipe et configurations disponibles.
            </p>
          </div>
        </div>
      </header>
      <div className="grid items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className={cn(WS_PANEL, "p-3 lg:sticky lg:top-20")}>
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
            Sections
          </p>
          <SettingsNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
