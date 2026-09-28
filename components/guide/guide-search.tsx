"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { GUIDE_SEARCH_DEBOUNCE_MS, GUIDE_SEARCH_MIN, guideChapters, guideSearchKey, searchGuide } from "@/lib/guide"
import { cn } from "@/lib/utils"

export function GuideSearch({ onOpen }: { onOpen: (href: string) => void }) {
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()
  const hits = useMemo(() => searchGuide(guideChapters, debounced).slice(0, 8), [debounced])
  const shown = open && query.trim().length >= GUIDE_SEARCH_MIN

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(query)
      setActive(-1)
    }, GUIDE_SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  function choose(href: string) {
    setOpen(false)
    setQuery("")
    setDebounced("")
    setActive(-1)
    onOpen(href)
  }

  function onKeyDown(key: string) {
    const action = guideSearchKey(key, active, shown ? hits.length : 0)
    if (!action) return
    if (action.type === "close") {
      setOpen(false)
      setActive(-1)
      input.current?.focus()
      return
    }
    if (action.type === "move") {
      setOpen(true)
      setActive(action.index)
      return
    }
    const hit = hits[action.index]
    if (hit) choose(hit.href)
  }

  return (
    <div ref={box} className="relative mx-auto mt-8 w-full max-w-2xl text-left">
      <label className="sr-only" htmlFor="guide-search">Que souhaitez-vous apprendre ?</label>
      <Input
        ref={input}
        id="guide-search"
        role="combobox"
        className="h-12 rounded-2xl px-4 text-base"
        value={query}
        placeholder="Que souhaitez-vous apprendre ?"
        autoComplete="off"
        aria-expanded={shown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        onFocus={() => {
          if (query.trim().length >= GUIDE_SEARCH_MIN) setOpen(true)
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(event.target.value.trim().length >= GUIDE_SEARCH_MIN)
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) {
            event.preventDefault()
            onKeyDown(event.key)
          }
        }}
      />
      {shown ? (
        <div id={listId} role="listbox" aria-label="Résultats" className="absolute z-30 mt-2 max-h-[min(24rem,50vh)] w-full overflow-y-auto rounded-2xl border bg-popover p-2 text-popover-foreground shadow-lg">
          <p className="px-3 py-2 text-xs tracking-[0.14em] text-muted-foreground uppercase">Résultats</p>
          {hits.length === 0 ? (
            <div className="px-3 py-4" role="status">
              <p className="font-medium">Aucun résultat trouvé</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Essayez avec un mot comme scoring, QR Code, lead, équipe ou Excel.</p>
            </div>
          ) : hits.map((hit, hitIndex) => (
            <button
              key={hit.id}
              id={`${listId}-${hitIndex}`}
              type="button"
              role="option"
              aria-selected={hitIndex === active}
              className={cn(
                "block w-full rounded-xl px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                hitIndex === active ? "bg-muted" : "hover:bg-muted/70",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(hitIndex)}
              onClick={() => choose(hit.href)}
            >
              <span className="block font-medium">{hit.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{hit.chapter}</span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                <span className="text-foreground/80">extrait : </span>
                {hit.excerpt}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
