"use client"

import { useEffect, useState } from "react"
import { ArrowRight, BarChart3, Files, ListChecks, Settings, UserRound, Users } from "lucide-react"
import { GuideBlocks } from "@/components/guide/guide-blocks"
import { GuideSearch } from "@/components/guide/guide-search"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { guideAnchor, guideChapters, sectionHeading } from "@/lib/guide"
import { cn } from "@/lib/utils"

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
    <nav aria-label="Sommaire" className="flex flex-col">
      {guideChapters.map((chapter) => (
        <a
          key={chapter.id}
          href={`#${chapter.id}`}
          onClick={() => onPick(chapter.id)}
          aria-current={active === chapter.id ? "true" : undefined}
          className={cn(
            "border-l-2 px-3 py-1.5 text-sm leading-5",
            active === chapter.id ? "border-brass font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
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
    <div className="space-y-14">
      <header id="guide-top" className="mx-auto max-w-3xl scroll-mt-24 pt-4 text-center">
        <h1 className="text-balance font-display text-4xl font-bold text-primary md:text-5xl">Centre d&apos;aide WOLOYEM Score</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Tout ce qu&apos;il faut pour créer, configurer, publier et analyser vos scorecards.
        </p>
        <GuideSearch onOpen={reveal} />
      </header>

      <ul className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quickCards.map((card) => {
          const Icon = card.icon
          return (
            <li key={card.href}>
              <a href={card.href} className="group flex h-full items-start gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-brass/50 hover:bg-muted/30">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brass/15 text-brass">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-lg font-bold text-primary">{card.title}</span>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-brass transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{card.description}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <div className="sticky top-16 z-10 lg:hidden">
        <Sheet open={menu} onOpenChange={setMenu}>
          <Button type="button" variant="outline" onClick={() => setMenu(true)}>Sommaire</Button>
          <SheetContent side="left" className="w-[min(20rem,85vw)] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Sommaire</SheetTitle>
            </SheetHeader>
            <ChapterLinks active={activeChapter} onPick={(id) => { setActiveChapter(id); setMenu(false) }} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="mx-auto lg:grid lg:max-w-6xl lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[11rem_minmax(0,40rem)_11rem]">
        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto lg:block">
          <p className="px-3 text-xs tracking-[0.16em] text-muted-foreground uppercase">Sommaire</p>
          <div className="mt-3">
            <ChapterLinks active={activeChapter} onPick={setActiveChapter} />
          </div>
        </aside>

        <div className="min-w-0">
          <p className="text-xs leading-5 text-muted-foreground">
            <a href="#guide-top" className="hover:text-foreground">Guide d&apos;utilisation</a>
            {current ? <span> &gt; <a href={`#${current.id}`} className="hover:text-foreground">{current.title}</a></span> : null}
            {current && currentSection ? <span> &gt; <a href={`#${guideAnchor(current.id, currentSection.id)}`} className="hover:text-foreground">{currentSection.title}</a></span> : null}
          </p>
          <div className="mt-10 space-y-20 md:space-y-24">
            {guideChapters.map((chapter, index) => {
              const previous = guideChapters[index - 1]
              const next = guideChapters[index + 1]
              return (
                <article key={chapter.id} id={chapter.id} data-chapter={chapter.id} className={cn("scroll-mt-28", index > 0 && "border-t pt-16 md:pt-20")}>
                  <h2 className={cn("font-display text-2xl font-bold text-primary md:text-3xl", flash === chapter.id && "guide-flash")}>{chapter.title}</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{chapter.description}</p>
                  <div className="mt-12 space-y-14">
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
                          <h3 className={cn("flex items-start gap-3 text-xl font-bold text-primary md:text-2xl", flash === anchor && "guide-flash")}>
                            {chapter.numbered ? (
                              <span aria-hidden="true" className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-brass text-sm font-bold text-brass-ink">
                                {String(sectionIndex + 1).padStart(2, "0")}
                              </span>
                            ) : null}
                            <span>
                              {chapter.numbered ? <span className="sr-only">{`Étape ${sectionIndex + 1}. `}</span> : null}
                              {chapter.numbered ? section.title : sectionHeading(chapter, section, sectionIndex)}
                            </span>
                          </h3>
                          <div className="mt-5 max-w-2xl">
                            <GuideBlocks blocks={section.blocks} />
                          </div>
                        </section>
                      )
                    })}
                  </div>
                  <nav className="mt-10 flex items-start justify-between gap-6 border-t pt-5" aria-label={`Navigation ${chapter.title}`}>
                    {previous ? (
                      <a href={`#${previous.id}`} className="max-w-[48%] text-sm hover:underline">
                        <span className="block text-xs text-muted-foreground">Précédent</span>
                        <span className="mt-1 block font-semibold text-primary">{previous.title}</span>
                      </a>
                    ) : <span />}
                    {next ? (
                      <a href={`#${next.id}`} className="max-w-[48%] text-right text-sm hover:underline">
                        <span className="block text-xs text-muted-foreground">Suivant</span>
                        <span className="mt-1 block font-semibold text-primary">{next.title}</span>
                      </a>
                    ) : <span />}
                  </nav>
                </article>
              )
            })}
          </div>
        </div>

        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto xl:block">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Sur cette page</p>
          {current ? (
            <nav aria-label="Sur cette page" className="mt-3 flex flex-col">
              {current.sections.map((section, sectionIndex) => (
                <a
                  key={section.id}
                  href={`#${guideAnchor(current.id, section.id)}`}
                  aria-current={section.id === activeSection ? "true" : undefined}
                  className={cn(
                    "border-l-2 px-3 py-1.5 text-sm leading-5",
                    section.id === activeSection ? "border-brass font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
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
