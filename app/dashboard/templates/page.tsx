import Link from "next/link"
import { LayoutTemplate, Search } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { UseTemplateButton } from "@/components/templates/use-template-button"
import { VisualTemplateCard } from "@/components/templates/visual-template-card"
import { can } from "@/lib/auth/permissions"
import { ensureMembership } from "@/lib/data/membership"
import { listTemplates } from "@/lib/data/scorecards"
import { VISUAL_THEMES } from "@/lib/scorecard-themes/catalog"
import { WS_ENTER, WS_FOCUS, WS_ICON_CHIP, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export const metadata = { title: "Modèles" }

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const membership = await ensureMembership()
  const templates = await listTemplates()
  const editor = membership ? can({ role: membership.role }, "scorecard.edit") : false
  const params = await searchParams
  const category = params.category?.trim() || "all"
  const query = params.q?.trim().toLowerCase() || ""

  const byCategory =
    category === "all"
      ? VISUAL_THEMES
      : VISUAL_THEMES.filter((theme) => theme.category.toLowerCase() === category.toLowerCase())

  const visualThemes = query
    ? byCategory.filter(
        (theme) =>
          theme.name.toLowerCase().includes(query) ||
          theme.description.toLowerCase().includes(query) ||
          theme.category.toLowerCase().includes(query),
      )
    : byCategory

  const categories = ["all", ...Array.from(new Set(VISUAL_THEMES.map((theme) => theme.category)))]
  const filtersActive = category !== "all" || Boolean(query)

  return (
    <div className="space-y-6">
      <header className={cn(WS_PANEL, "p-5 md:p-6")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className={cn(WS_ICON_CHIP, "size-11 rounded-2xl")}>
              <LayoutTemplate className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
                Bibliothèque
              </p>
              <h1 className="mt-1 text-[1.35rem] font-semibold tracking-tight text-foreground md:text-[1.5rem]">
                Modèles ScoreApp
              </h1>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                Choisissez un design premium pour la page d&apos;accueil, puis personnalisez textes,
                couleurs et images dans le builder. Les modèles sources ne sont jamais modifiés.
              </p>
            </div>
          </div>
          <form action="/dashboard/templates" className="relative w-full lg:max-w-xs">
            {category !== "all" ? (
              <input type="hidden" name="category" value={category} />
            ) : null}
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Rechercher un modèle"
              aria-label="Rechercher un modèle"
              className={cn(
                "h-9 w-full rounded-xl border border-border bg-background pr-3 pl-9 text-[13px] outline-none",
                "transition-[border-color,box-shadow] focus:border-[color:var(--brand-500)] focus:ring-2 focus:ring-[color:var(--brand-500)]/25",
              )}
            />
          </form>
        </div>
      </header>

      <section className={cn(WS_PANEL, "overflow-hidden")}>
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3.5 md:px-5">
          {categories.map((item) => {
            const active = item === "all" ? category === "all" : category === item
            const href =
              item === "all"
                ? query
                  ? `/dashboard/templates?q=${encodeURIComponent(params.q ?? "")}`
                  : "/dashboard/templates"
                : `/dashboard/templates?category=${encodeURIComponent(item)}${
                    query ? `&q=${encodeURIComponent(params.q ?? "")}` : ""
                  }`
            return (
              <Link
                key={item}
                href={href}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-semibold transition-colors",
                  WS_FOCUS,
                  active
                    ? "border-[color:var(--brand-500)]/40 bg-[color:var(--brand-500)]/12 text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)]"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item === "all" ? "Tous les designs" : item}
              </Link>
            )
          })}
          {filtersActive ? (
            <Link href="/dashboard/templates" className={cn("ml-auto text-[12px]", WS_LINK)}>
              Réinitialiser
            </Link>
          ) : null}
        </div>

        {visualThemes.length === 0 ? (
          <div className={cn(WS_ENTER, "px-4 py-12 text-center md:px-5")}>
            <span className={cn(WS_ICON_CHIP, "mx-auto size-12 rounded-2xl")}>
              <LayoutTemplate className="size-5" aria-hidden />
            </span>
            <p className="mt-4 text-base font-semibold text-foreground">Aucun modèle</p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Aucun thème ne correspond à ces critères.
            </p>
            <Link href="/dashboard/templates" className={cn("mt-4 inline-block text-[13px]", WS_LINK)}>
              Réinitialiser les filtres
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:gap-5 md:p-5 xl:grid-cols-2">
            {visualThemes.map((theme, index) => (
              <VisualTemplateCard
                key={theme.id}
                theme={theme}
                canCreate={editor}
                index={index}
              />
            ))}
          </div>
        )}

        {!editor ? (
          <p className="border-t border-border px-5 py-3 text-[13px] text-muted-foreground">
            Votre rôle permet de consulter les modèles, pas d&apos;en créer une scorecard.
          </p>
        ) : null}
      </section>

      <section className={cn(WS_PANEL, "overflow-hidden")}>
        <div className="border-b border-border px-4 py-4 md:px-5">
          <h2 className="text-[1.1rem] font-semibold tracking-tight text-foreground">
            Questionnaires métier
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Modèles système existants (PMP, CAPM…). Ils créent un brouillon ; les questions restent à
            compléter dans le builder.
          </p>
        </div>
        {templates.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Aucun modèle métier"
              description="Les modèles WOLOYEM ne sont pas encore disponibles. Créez une scorecard vide en attendant."
              action={
                <Link
                  className={cn(
                    "inline-flex h-9 items-center rounded-xl bg-[color:var(--brand-950)] px-4 text-[13px] font-semibold text-white",
                    "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
                    WS_FOCUS,
                  )}
                  href="/dashboard/scorecards"
                >
                  Voir les scorecards
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
            {templates.map((template, index) => (
              <article
                key={template.id}
                className={cn(
                  WS_ENTER,
                  "flex flex-col rounded-2xl border border-border bg-[color:var(--surface)] p-5",
                  "motion-safe:transition-[border-color] hover:border-[color:var(--brand-500)]/30",
                )}
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <p className="text-[10px] font-semibold tracking-[0.14em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
                  {template.category}
                </p>
                <h3 className="mt-2 text-[1.1rem] font-semibold text-foreground">{template.name}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                  {template.description}
                </p>
                {template.objective ? (
                  <p className="mt-3 text-[13px] text-foreground">{template.objective}</p>
                ) : null}
                <div className="mt-5">
                  <UseTemplateButton templateId={template.id} disabled={!editor} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
