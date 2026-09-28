"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { searchWorkspace, type SearchHit, type SearchResult } from "@/actions/search"
import { Button } from "@/components/ui/button"
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH, nextSearchKey } from "@/lib/search/global"

const PLACEHOLDER = "Rechercher dans WOLOYEM Score"
const ERROR_MESSAGE = "Impossible d'effectuer la recherche. Réessayez."

type Ready = Extract<SearchResult, { ok: true }>

function groupsOf(result: Ready | null) {
  if (!result || result.skipped) return []
  return [
    { label: "Scorecards", hits: result.scorecards },
    { label: "Leads", hits: result.leads },
    { label: "Membres", hits: result.members },
  ].filter((group) => group.hits.length > 0)
}

function SearchField({
  autoFocus,
  layout,
  onDismiss,
}: {
  autoFocus?: boolean
  layout: "dropdown" | "sheet"
  onDismiss?: () => void
}) {
  const router = useRouter()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const generation = useRef(0)
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [result, setResult] = useState<Ready | null>(null)
  const [index, setIndex] = useState(0)
  const groups = groupsOf(status === "ready" ? result : null)
  const flat = groups.flatMap((group) => group.hits)
  const activeId = flat[index] ? `${listId}-${flat[index].id}` : undefined
  const term = value.trim()
  const showPanel = open && term.length >= SEARCH_MIN_LENGTH

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  function onChange(nextValue: string) {
    setValue(nextValue)
    const next = nextValue.trim()
    if (next.length < SEARCH_MIN_LENGTH) {
      generation.current += 1
      setStatus("idle")
      setResult(null)
      setOpen(false)
      return
    }
    setOpen(true)
    setStatus("loading")
  }

  useEffect(() => {
    if (term.length < SEARCH_MIN_LENGTH) return
    const current = ++generation.current
    const timer = window.setTimeout(() => {
      void searchWorkspace(term).then((payload) => {
        if (generation.current !== current) return
        if (!payload.ok) {
          setResult(null)
          setStatus("error")
          return
        }
        setResult(payload)
        setStatus("ready")
        setIndex(0)
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [term])

  useEffect(() => {
    if (!activeId) return
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" })
  }, [activeId])

  function openHit(hit: SearchHit) {
    setOpen(false)
    onDismiss?.()
    router.push(hit.href)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const next = nextSearchKey({ open: showPanel, index, count: flat.length }, event.key)
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Escape" || (event.key === "Enter" && showPanel)) {
      event.preventDefault()
    }
    if (event.key === "Escape") {
      setOpen(false)
      onDismiss?.()
      return
    }
    if (!showPanel) return
    setIndex(next.index)
    if (next.activate) {
      const hit = flat[next.index]
      if (hit) openHit(hit)
    }
  }

  let body: React.ReactNode = null
  if (status === "loading") body = <p className="px-3 py-2 text-sm text-muted-foreground">Recherche…</p>
  else if (status === "error") body = <p className="px-3 py-2 text-sm">{ERROR_MESSAGE}</p>
  else if (status === "ready" && flat.length === 0) {
    body = <p className="px-3 py-2 text-sm">Aucun résultat pour &quot;{result?.query || term}&quot;.</p>
  } else if (flat.length > 0) {
    let offset = 0
    body = groups.map((group) => {
      const start = offset
      offset += group.hits.length
      return (
        <div key={group.label} className="py-1">
          <p className="px-3 py-1 text-xs tracking-wide text-muted-foreground uppercase">{group.label}</p>
          {group.hits.map((hit, hitIndex) => {
            const position = start + hitIndex
            const selected = position === index
            return (
              <button
                key={hit.id}
                id={`${listId}-${hit.id}`}
                type="button"
                role="option"
                aria-selected={selected}
                data-search-option=""
                data-active={selected ? "true" : "false"}
                className={selected ? "flex w-full flex-col rounded-lg bg-muted px-3 py-2 text-left" : "flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-muted"}
                onMouseEnter={() => setIndex(position)}
                onClick={() => openHit(hit)}
              >
                <span className="text-sm">{hit.title}</span>
                {hit.meta ? <span className="text-xs text-muted-foreground">{hit.meta}</span> : null}
              </button>
            )
          })}
        </div>
      )
    })
  }

  return (
    <div className={layout === "dropdown" ? "relative" : "flex min-h-0 flex-1 flex-col"}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={showPanel ? activeId : undefined}
          aria-label={PLACEHOLDER}
          placeholder={PLACEHOLDER}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (term.length >= SEARCH_MIN_LENGTH) setOpen(true)
          }}
          className="h-10 w-full rounded-xl border bg-card pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/40"
        />
      </div>
      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Résultats"
          data-search-panel=""
          className={layout === "dropdown"
            ? "absolute top-12 z-30 max-h-80 w-full max-w-md overflow-auto rounded-xl border bg-card p-1 shadow-lg"
            : "mt-3 min-h-0 flex-1 overflow-auto rounded-xl border bg-card p-1"}
        >
          {body}
        </div>
      ) : null}
    </div>
  )
}

export function DashboardSearch() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <div className="relative hidden min-w-0 flex-1 md:block">
        <div className="max-w-md">
          <SearchField layout="dropdown" />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="md:hidden"
        aria-label="Rechercher"
        onClick={() => setMobileOpen(true)}
      >
        <Search />
      </Button>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background p-4 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={PLACEHOLDER}
          onKeyDown={(event) => {
            if (event.key === "Escape") setMobileOpen(false)
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{PLACEHOLDER}</p>
            <Button type="button" variant="ghost" onClick={() => setMobileOpen(false)}>Fermer</Button>
          </div>
          <SearchField autoFocus layout="sheet" onDismiss={() => setMobileOpen(false)} />
        </div>
      ) : null}
    </>
  )
}
