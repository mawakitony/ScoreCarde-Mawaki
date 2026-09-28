import { FlaskConical, Info, Lightbulb, TriangleAlert } from "lucide-react"
import type { CalloutKind } from "@/lib/guide/types"
import { cn } from "@/lib/utils"

const labels: Record<CalloutKind, string> = {
  tip: "Astuce",
  important: "Important",
  warning: "Attention",
  example: "Exemple",
}

const styles: Record<CalloutKind, string> = {
  tip: "border-guide-tip-line bg-guide-tip text-foreground",
  important: "border-guide-info-line bg-guide-info text-foreground",
  warning: "border-guide-warn-line bg-guide-warn text-foreground",
  example: "border-guide-example-line bg-guide-example text-foreground",
}

const titleStyles: Record<CalloutKind, string> = {
  tip: "text-guide-tip-title",
  important: "text-guide-info-title",
  warning: "text-guide-warn-title",
  example: "text-guide-example-title",
}

const icons = {
  tip: Lightbulb,
  important: Info,
  warning: TriangleAlert,
  example: FlaskConical,
}

export function GuideCallout({ kind, text }: { kind: CalloutKind; text: string }) {
  const Icon = icons[kind]
  return (
    <aside className={cn("rounded-xl border-l-4 px-4 py-3 text-sm leading-7", styles[kind])}>
      <p className={cn("flex items-center gap-2 font-bold", titleStyles[kind])}>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {labels[kind]}
      </p>
      <p className="mt-1">{text}</p>
    </aside>
  )
}

export function GuideRoles({ roles }: { roles: string[] }) {
  return (
    <p className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Disponible pour</span>
      {roles.map((role) => (
        <span key={role} className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
          {role}
        </span>
      ))}
    </p>
  )
}

export function GuideConfig({ text }: { text: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm leading-7">
      <span className="rounded-full border border-brass/50 bg-brass/15 px-2.5 py-1 text-xs font-semibold text-foreground">Configuration requise</span>
      <span>{text}</span>
    </p>
  )
}

export function GuideContrast({ leftTitle, left, rightTitle, right }: { leftTitle: string; left: string; rightTitle: string; right: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold tracking-[0.14em] text-brass uppercase">À ne pas confondre</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
          <p className="text-sm font-bold tracking-wide text-primary uppercase">{leftTitle}</p>
          <p className="mt-2 text-sm leading-7">{left}</p>
        </div>
        <div className="rounded-xl border border-brass/40 bg-brass/10 p-4">
          <p className="text-sm font-bold tracking-wide text-foreground uppercase">{rightTitle}</p>
          <p className="mt-2 text-sm leading-7">{right}</p>
        </div>
      </div>
    </div>
  )
}
