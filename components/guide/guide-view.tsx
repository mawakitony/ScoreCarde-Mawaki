"use client"

import { useEffect, useState } from "react"
import { ArrowRight, BarChart3, BookOpen, Files, ListChecks, Settings, UserRound, Users } from "lucide-react"
import { GuideBlocks } from "@/components/guide/guide-blocks"
import { GuideSearch } from "@/components/guide/guide-search"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { guideAnchor, guideChapters, sectionHeading } from "@/lib/guide"
import { WS_ENTER, WS_FOCUS, WS_ICON_CHIP, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

const panel = WS_PANEL

const quickCards = [
  { href: "#premiere-scorecard", title: "Créer une scorecard", description: "De la création à la publication.", icon: Files },
  { href: "#questions", title: "Questions & logique", description: "Types de questions, conditions et scoring.", icon: ListChecks },
  { href: "#leads", title: "Leads & CRM", description: "Suivre, filtrer et gérer vos contacts.", icon: Users },
  { href: "#analytics", title: "Analytics", description: "Comprendre les résultats et les performances.", icon: BarChart3 },
  { href: "#equipe", title: "Équipe", description: "Rôles, permissions et accès.", icon: UserRound },
  { href: "#parametres", title: "Paramètres", description: "Organisation, domaines et intégrations.", icon: Settings },
]

function ChapterLinks({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  return (
    <nav aria-label="Sommaire" className="flex flex-col gap-0.5">
      {guideChapters.map((chapter) => (
        <a
          key={chapter.id}
          href={`#${chapter.id}`}
          onClick={() => onPick(chapter.id)}
          aria-current={active === chapter.id ? "true" : undefined}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm leading-5 focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none",
            active === chapter.id ? "bg-muted font-semibold text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)]" : "text-muted-foreground hover:bg-background hover:text-foreground",
          )}
        >
          {chapter.title}
        </a>
      ))}
    </nav>
  )
}

export function GuideView() {
  const [menu, setMenu] = useState(false)
  const [activeChapter, setActiveChapter] = useState(guideChapters[0]?.id ?? "")
  const [activeSection, setActiveSection] = useState(guideChapters[0]?.sections[0]?.id ?? "")
  const [flash, setFlash] = useState<string | null>(null)
  const current = guideChapters.find((chapter) => chapter.id === activeChapter) ?? guideChapters[0]
  const currentSection = current?.sections.find((section) => section.id === activeSection) ?? current?.sections[0]

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-guide-section]"))
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      const chapter = visible?.target.getAttribute("data-chapter")
      const section = visible?.target.getAttribute("data-section")
      if (chapter) setActiveChapter(chapter)
      if (section) setActiveSection(section)
    }, { rootMargin: "-20% 0px -60% 0px", threshold: [0.15, 0.4] })
    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [])

  function reveal(href: string) {
    const id = href.replace(/^#/, "")
    const node = document.getElementById(id)
    if (!node) return
    const chapter = node.getAttribute("data-chapter") || node.id
    const section = node.getAttribute("data-section")
    if (chapter) setActiveChapter(chapter)
    if (section) setActiveSection(section)
    node.scrollIntoView({ behavior: "smooth", block: "start" })
    setFlash(id)
    window.setTimeout(() => setFlash((currentId) => currentId === id ? null : currentId), 1600)
    const heading = node.querySelector("h2, h3")
    if (heading instanceof HTMLElement) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  }

  return (
    <div className="space-y-4">
      <header id="guide-top" className={cn(panel, "scroll-mt-24 p-5 md:p-6")}>
        <div className="flex items-start gap-3">
          <span className={cn(WS_ICON_CHIP, "size-11 rounded-2xl")}>
            <BookOpen className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
              Documentation
            </p>
            <h1 className="mt-1 text-[1.35rem] font-semibold tracking-tight text-foreground md:text-[1.5rem]">
              Centre d&apos;aide
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              Créer, configurer, publier et analyser vos scorecards. Recherche locale sur le contenu de ce guide.
            </p>
          </div>
        </div>
        <GuideSearch onOpen={reveal} />
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quickCards.map((card, index) => {
          const Icon = card.icon
          return (
            <li key={card.href} className={WS_ENTER} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
              <a
                href={card.href}
                className={cn(
                  panel,
                  "group flex h-full items-start gap-4 p-4",
                  "motion-safe:transition-[border-color,transform] hover:border-[color:var(--brand-300)]/40",
                  "motion-safe:hover:-translate-y-0.5",
                  WS_FOCUS,
                )}
              >
                <span className={cn(WS_ICON_CHIP, "size-10 rounded-xl")}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-foreground">{card.title}</span>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)]" aria-hidden />
                  </span>
                  <span className="mt-1 block text-[13px] leading-6 text-muted-foreground">{card.description}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <div className="sticky top-16 z-10 lg:hidden">
        <Sheet open={menu} onOpenChange={setMenu}>
          <Button type="button" variant="outline" className="h-9 rounded-full" onClick={() => setMenu(true)}>Sommaire</Button>
          <SheetContent side="left" className="w-[min(20rem,85vw)] overflow-y-auto border-border bg-card">
            <SheetHeader>
              <SheetTitle className="text-foreground">Sommaire</SheetTitle>
            </SheetHeader>
            <ChapterLinks active={activeChapter} onPick={(id) => { setActiveChapter(id); setMenu(false) }} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_13rem]">
        <aside className={`${panel} sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto p-3 lg:block`}>
          <p className="px-3 text-xs tracking-[0.16em] text-muted-foreground uppercase">Sommaire</p>
          <div className="mt-2">
            <ChapterLinks active={activeChapter} onPick={setActiveChapter} />
          </div>
        </aside>

        <div className={`${panel} min-w-0 p-5 md:p-6`}>
          <p className="text-xs leading-5 text-muted-foreground">
            <a href="#guide-top" className="hover:text-foreground">Centre d&apos;aide</a>
            {current ? <span> › <a href={`#${current.id}`} className="hover:text-foreground">{current.title}</a></span> : null}
            {current && currentSection ? <span> › <a href={`#${guideAnchor(current.id, currentSection.id)}`} className="hover:text-foreground">{currentSection.title}</a></span> : null}
          </p>
          <div className="mt-8 space-y-16">
            {guideChapters.map((chapter, index) => {
              const previous = guideChapters[index - 1]
              const next = guideChapters[index + 1]
              return (
                <article key={chapter.id} id={chapter.id} data-chapter={chapter.id} className={cn("scroll-mt-28", index > 0 && "border-t border-border pt-12")}>
                  <h2 className={cn("text-xl font-semibold tracking-tight text-foreground md:text-2xl", flash === chapter.id && "guide-flash")}>{chapter.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{chapter.description}</p>
                  <div className="mt-10 space-y-12">
                    {chapter.sections.map((section, sectionIndex) => {
                      const anchor = guideAnchor(chapter.id, section.id)
                      return (
                        <section
                          key={section.id}
                          id={anchor}
                          data-guide-section
                          data-chapter={chapter.id}
                          data-section={section.id}
                          className="scroll-mt-28"
                        >
                          <h3 className={cn("flex items-start gap-3 text-lg font-semibold text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)] md:text-xl", flash === anchor && "guide-flash")}>
                            {chapter.numbered ? (
                              <span aria-hidden="true" className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[color:var(--brand-300)]/15 text-xs font-bold text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)]">
                                {String(sectionIndex + 1).padStart(2, "0")}
                              </span>
                            ) : null}
                            <span>
                              {chapter.numbered ? <span className="sr-only">{`Étape ${sectionIndex + 1}. `}</span> : null}
                              {chapter.numbered ? section.title : sectionHeading(chapter, section, sectionIndex)}
                            </span>
                          </h3>
                          <div className="mt-4 max-w-2xl">
                            <GuideBlocks blocks={section.blocks} />
                          </div>
                        </section>
                      )
                    })}
                  </div>
                  <nav className="mt-10 flex items-start justify-between gap-6 border-t border-border pt-5" aria-label={`Navigation ${chapter.title}`}>
                    {previous ? (
                      <a href={`#${previous.id}`} className="max-w-[48%] text-sm hover:underline">
                        <span className="block text-xs text-muted-foreground">Précédent</span>
                        <span className="mt-1 block font-semibold text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)]">{previous.title}</span>
                      </a>
                    ) : <span />}
                    {next ? (
                      <a href={`#${next.id}`} className="max-w-[48%] text-right text-sm hover:underline">
                        <span className="block text-xs text-muted-foreground">Suivant</span>
                        <span className="mt-1 block font-semibold text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)]">{next.title}</span>
                      </a>
                    ) : <span />}
                  </nav>
                </article>
              )
            })}
          </div>
        </div>

        <aside className={`${panel} sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto p-3 xl:block`}>
          <p className="px-3 text-xs tracking-[0.16em] text-muted-foreground uppercase">Sur cette page</p>
          {current ? (
            <nav aria-label="Sur cette page" className="mt-2 flex flex-col gap-0.5">
              {current.sections.map((section, sectionIndex) => (
                <a
                  key={section.id}
                  href={`#${guideAnchor(current.id, section.id)}`}
                  aria-current={section.id === activeSection ? "true" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm leading-5 focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none",
                    section.id === activeSection ? "bg-muted font-semibold text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)]" : "text-muted-foreground hover:bg-background hover:text-foreground",
                  )}
                >
                  {sectionHeading(current, section, sectionIndex)}
                </a>
              ))}
            </nav>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
