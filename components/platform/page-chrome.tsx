import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { WS_PANEL } from "@/lib/ui/workspace-surface"

export function PlatformPageHeader({
  title,
  description,
  actions,
  crumbs,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  crumbs?: { href?: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="min-w-0 space-y-0.5">
        {crumbs?.length ? (
          <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
                {index > 0 ? <ChevronRight className="size-3 opacity-60" aria-hidden /> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="font-medium text-[color:var(--pa-primary)] underline-offset-2 hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="font-display text-xl tracking-tight text-[color:var(--pa-ink)] md:text-2xl">{title}</h1>
        {description ? <p className="max-w-2xl text-[13px] text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function PlatformPanel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn(WS_PANEL, "p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-base font-semibold tracking-tight text-[color:var(--pa-ink)]">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function PlatformEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-[color:var(--pa-bg)]/60 px-4 py-10 text-center">
      <p className="text-sm font-semibold text-[color:var(--pa-ink)]">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export function PlatformNotice({ message }: { message: string }) {
  const error = /erreur|échou|insuff|interdit|refus|invalide/i.test(message)
  return (
    <p
      role="status"
      className={cn(
        "rounded-xl border px-3 py-2 text-sm",
        error
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900",
      )}
    >
      {message}
    </p>
  )
}

export function PlatformTable({ children, minWidth = "720px" }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function PlatformTh({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("border-b border-border bg-[color:var(--pa-bg)] px-3 py-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase", className)}>
      {children}
    </th>
  )
}

export function PlatformTd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-border/70 px-3 py-3 align-middle", className)}>{children}</td>
}

export function PlatformBtn({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-[background-color,opacity,box-shadow] focus-visible:ring-2 focus-visible:ring-[color:var(--pa-primary)]/35 focus-visible:outline-none disabled:opacity-50",
        variant === "primary" && "bg-[color:var(--pa-primary)] text-white hover:opacity-95",
        variant === "secondary" && "border border-border bg-white text-[color:var(--pa-ink)] hover:bg-[color:var(--pa-bg)]",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        variant === "ghost" && "text-[color:var(--pa-primary)] underline-offset-2 hover:underline",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function PlatformField({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const ariaLabel =
    props["aria-label"] ??
    (typeof props.placeholder === "string" && props.placeholder ? props.placeholder : undefined) ??
    (typeof props.name === "string" ? props.name : undefined)
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-[color:var(--pa-primary)] focus:ring-2 focus:ring-[color:var(--pa-primary)]/20",
        className,
      )}
      aria-label={ariaLabel}
    />
  )
}

export function PlatformSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const ariaLabel =
    props["aria-label"] ?? (typeof props.name === "string" ? `Filtre ${props.name}` : undefined)
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-white px-2 text-sm outline-none transition-[border-color,box-shadow] focus:border-[color:var(--pa-primary)] focus:ring-2 focus:ring-[color:var(--pa-primary)]/20",
        className,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </select>
  )
}
