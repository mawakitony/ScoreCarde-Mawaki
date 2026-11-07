"use client"

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import { Check, Pause, Play, Sparkles, TrendingUp } from "lucide-react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import {
  AUTH_SCENE_MS,
  AUTH_SCENES,
  clampAuthSceneIndex,
  nextAuthSceneIndex,
  shouldAutoAdvanceScenes,
  type AuthSceneId,
} from "@/lib/auth/motion-scenes"
import { cn } from "@/lib/utils"

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange)
  return () => document.removeEventListener("visibilitychange", onChange)
}

function tabIsHidden() {
  return document.visibilityState === "hidden"
}

function useTabHidden() {
  return useSyncExternalStore(subscribeVisibility, tabIsHidden, () => false)
}

/**
 * Immersive left-column product showcase — illustrative demo only.
 * z-index: ambient 0 · copy/footer 10 · product window 20 · float accents 30
 */
export function ScoreMotionShowcase({
  className,
  compact = false,
  immersive = false,
}: {
  className?: string
  compact?: boolean
  immersive?: boolean
}) {
  const reduced = usePrefersReducedMotion()
  const tabHidden = useTabHidden()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const scene = AUTH_SCENES[index]!
  const animate = shouldAutoAdvanceScenes({ prefersReducedMotion: reduced, tabHidden, paused })

  useEffect(() => {
    if (!animate) return
    const timer = window.setInterval(() => {
      setIndex((current) => nextAuthSceneIndex(current))
    }, AUTH_SCENE_MS)
    return () => window.clearInterval(timer)
  }, [animate])

  function goTo(next: number) {
    setPaused(true)
    setIndex(clampAuthSceneIndex(next))
  }

  return (
    <div
      className={cn(
        "auth-motion relative flex h-full min-h-0 flex-col overflow-hidden text-white",
        compact && "auth-motion-compact",
        immersive && "auth-motion-immersive",
        className,
      )}
      data-paused={paused || reduced || tabHidden ? "true" : "false"}
      data-auth-scene={scene.id}
    >
      {compact ? null : <AmbientLayer />}

      {!compact ? (
        <header className="relative z-10 flex shrink-0 items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/20 backdrop-blur-md">
              <BrandMark />
            </span>
            <div>
              <p className="text-[17px] font-semibold tracking-tight">WOLOYEM Score</p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-[#AFC5F8] uppercase">
                Plateforme d&apos;évaluation intelligente
              </p>
            </div>
          </div>
          <PauseControl paused={paused || reduced} onToggle={() => setPaused((v) => !v)} disabled={reduced} />
        </header>
      ) : null}

      <div className={cn("relative z-10 shrink-0", compact ? "min-h-0" : "mt-7 xl:mt-8")}>
        <div key={`${scene.id}-copy`} className="auth-scene-copy">
          <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/80 backdrop-blur-sm">
            <Sparkles className="size-3 text-[#AFC5F8]" aria-hidden />
            {scene.label} · démo
          </p>
          <h2
            className={cn(
              "font-semibold tracking-tight text-balance",
              compact ? "text-[1.2rem] leading-snug" : "text-[2rem] leading-[1.12] xl:text-[2.35rem]",
            )}
          >
            {scene.title}
          </h2>
          {compact ? null : (
            <p className="mt-2.5 max-w-lg text-[15px] leading-relaxed text-white/72 xl:text-[15.5px]">{scene.subtitle}</p>
          )}
        </div>
      </div>

      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 items-center justify-center",
          compact ? "mt-4 max-h-[240px]" : "mt-5 xl:mt-6",
        )}
      >
        <div
          key={`${scene.id}-stage`}
          className={cn("auth-scene-stage relative w-full", compact ? "max-w-full" : "max-w-[560px]")}
        >
          {scene.id === "scorecards" ? <SceneScorecards compact={compact} /> : null}
          {scene.id === "leads" ? <SceneLeads compact={compact} /> : null}
          {scene.id === "analytics" ? <SceneAnalytics compact={compact} /> : null}
        </div>
      </div>

      <div className={cn("relative z-10 mt-auto flex shrink-0 items-center justify-between gap-3", compact ? "pt-3" : "pt-5")}>
        <div className="flex items-center gap-2" role="tablist" aria-label="Scènes de présentation">
          {AUTH_SCENES.map((item, sceneIndex) => {
            const selected = sceneIndex === index
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`Scène ${sceneIndex + 1} : ${item.label}`}
                data-scene-tab={item.id}
                className={cn(
                  "group relative h-2.5 overflow-hidden rounded-full transition-all duration-300",
                  "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none",
                  selected ? "w-10 bg-white/25" : "w-2.5 bg-white/30 hover:bg-white/50",
                )}
                onClick={() => goTo(sceneIndex)}
              >
                {selected && animate ? <span className="auth-scene-progress absolute inset-y-0 left-0 rounded-full bg-white" /> : null}
                {selected && !animate ? <span className="absolute inset-0 rounded-full bg-white" /> : null}
              </button>
            )
          })}
        </div>
        {compact ? (
          <PauseControl paused={paused || reduced} onToggle={() => setPaused((v) => !v)} disabled={reduced} compact />
        ) : (
          <p className="text-[11px] tracking-[0.14em] text-white/50 uppercase">Démonstration illustrative</p>
        )}
      </div>
    </div>
  )
}

function PauseControl({
  paused,
  onToggle,
  disabled,
  compact,
}: {
  paused: boolean
  onToggle: () => void
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={paused}
      aria-label={paused ? "Reprendre la présentation" : "Mettre en pause la présentation"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 font-medium text-white/90 backdrop-blur-md",
        "transition-colors hover:bg-white/16 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        compact ? "size-8 justify-center px-0" : "px-3 py-1.5 text-[12px]",
      )}
    >
      {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
      {compact ? null : <span>{paused ? "Reprendre" : "Pause"}</span>}
    </button>
  )
}

function AmbientLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="auth-halo absolute -top-24 -right-20 size-80 rounded-full bg-[#6E92F2]/22 blur-3xl" />
      <div className="auth-halo-slow absolute -bottom-28 -left-16 size-96 rounded-full bg-[#6E92F2]/14 blur-3xl" />
      <span className="auth-float absolute top-28 right-10 size-3 rounded-full bg-white/25" />
      <span className="auth-float-delay absolute top-44 right-24 size-2.5 rounded-md bg-[#6E92F2]/75" />
      <span className="auth-float-alt absolute bottom-28 left-8 size-3 rotate-45 bg-white/18" />
    </div>
  )
}

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
      <path d="M8 22.5 13.2 9h2.3L21 22.5h-2.3l-1.1-2.8h-6.1l-1.1 2.8H8Zm4.2-4.6h4.3L14.3 12.6h-.1l-2 5.3Z" fill="#E6EDFD" />
      <rect x="8" y="24.2" width="16" height="1.6" rx="0.8" fill="#6E92F2" />
    </svg>
  )
}

function ProductWindow({
  title,
  children,
  compact,
}: {
  title: string
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "auth-window relative z-20 overflow-hidden rounded-2xl border border-white/20 bg-white/95",
        "shadow-[0_40px_80px_-36px_rgba(8,20,36,0.85)] ring-1 ring-black/5 backdrop-blur-xl",
      )}
    >
      <div className="flex items-center gap-2 border-b border-[#E8EEF3] bg-[#F4F7FA]/95 px-3.5 py-2.5">
        <span className="size-2.5 rounded-full bg-[#F0B4AE]" />
        <span className="size-2.5 rounded-full bg-[#AFC5F8]" />
        <span className="size-2.5 rounded-full bg-[#AFC5F8]" />
        <span className="ml-2 truncate text-[11px] font-medium text-[#5E6D7E]">{title}</span>
        <span className="ml-auto rounded-full bg-[#E7EEF5] px-2 py-0.5 text-[9px] font-semibold tracking-wide text-[#071039] uppercase">
          Demo
        </span>
      </div>
      <div className={cn(compact ? "p-3" : "p-4 sm:p-5")}>{children}</div>
    </div>
  )
}

function GlassCard({
  className,
  children,
  delayClass,
}: {
  className?: string
  children: ReactNode
  delayClass?: string
}) {
  return (
    <div
      className={cn(
        "auth-float-card z-30 rounded-2xl border border-white/30 bg-white/14 p-3 text-white",
        "shadow-[0_18px_40px_-20px_rgba(0,0,0,0.55)] backdrop-blur-md",
        delayClass,
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Stage gutter: float cards live in the padded margins so they only
 * kiss the chrome edge — never titles, questions, or KPI rows.
 */
function SceneStage({ compact, children }: { compact?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "auth-play relative",
        compact ? "px-0 pb-0 pt-0" : "px-6 pb-16 pt-14 xl:px-8 xl:pb-[4.5rem] xl:pt-16",
      )}
    >
      {children}
    </div>
  )
}

function SceneScorecards({ compact }: { compact?: boolean }) {
  return (
    <SceneStage compact={compact}>
      {!compact ? (
        <>
          {/* Anchored in top gutter — overlaps chrome by ~8px max */}
          <GlassCard className="auth-float-card-1 absolute top-2 left-2 w-[138px] xl:left-3">
            <p className="text-[10px] text-white/65">Scorecard</p>
            <p className="mt-1 text-[12px] font-semibold">Maturité · Demo</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="auth-mini-progress h-full w-[68%] rounded-full bg-[#6E92F2]" />
            </div>
          </GlassCard>
          {/* Anchored in bottom gutter — fully below product content */}
          <GlassCard className="auth-float-card-2 auth-result-chip absolute right-3 bottom-2 w-[124px] xl:right-4">
            <p className="text-[10px] text-white/65">Résultat</p>
            <p className="mt-1 text-[13px] font-semibold text-[#AFC5F8]">Éligible</p>
          </GlassCard>
        </>
      ) : null}

      <ProductWindow title="woloyem.app / scorecard · démo" compact={compact}>
        <div className="flex items-center justify-between gap-2 text-[#071039]">
          <p className={cn("font-semibold", compact ? "text-[13px]" : "text-[15px]")}>Diagnostic maturité</p>
          <span className="rounded-full bg-[#E7EEF5] px-2 py-0.5 text-[10px] font-semibold">Q. 2/5</span>
        </div>
        <div className={cn("overflow-hidden rounded-full bg-[#E7EEF5]", compact ? "mt-3 h-1.5" : "mt-4 h-2")}>
          <div className="auth-progress h-full rounded-full bg-[#2E5DE6]" />
        </div>
        <ul className={cn(compact ? "mt-3 space-y-2" : "mt-4 space-y-2.5")}>
          {[
            { q: "Votre processus est-il documenté ?", done: true, selected: false },
            { q: "Mesurez-vous la satisfaction client ?", done: true, selected: true },
            { q: "Suivez-vous les leads qualifiés ?", done: false, selected: false },
          ].map((row, i) => (
            <li
              key={row.q}
              className={cn(
                "auth-q flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
                `auth-q-${i + 1}`,
                row.selected && "auth-q-selected border-[#2E5DE6]/45 bg-[#E6EDFD] ring-2 ring-[#2E5DE6]/20",
                !row.selected && "border-[#D5E0F8]/80 bg-white",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  row.done ? "bg-[#2E5DE6] text-white" : "border border-[#C9D4DE] bg-white",
                )}
              >
                {row.done ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className="text-[12px] leading-snug font-medium text-[#071039]">{row.q}</span>
            </li>
          ))}
        </ul>
      </ProductWindow>
    </SceneStage>
  )
}

function SceneLeads({ compact }: { compact?: boolean }) {
  const leads = [
    { name: "Alex Martin", score: 82, badge: "Chaud", highlight: true },
    { name: "Sam Rivera", score: 64, badge: "Tiède", highlight: false },
    { name: "Jordan Lee", score: 41, badge: "Froid", highlight: false },
  ]
  return (
    <SceneStage compact={compact}>
      {!compact ? (
        <GlassCard className="auth-float-card-1 absolute top-2 right-2 w-[138px] xl:right-3">
          <div className="flex items-center gap-1 text-[#AFC5F8]">
            <TrendingUp className="size-3.5" />
            <span className="text-[11px] font-semibold">+18 % leads</span>
          </div>
          <svg viewBox="0 0 100 28" className="mt-2 h-7 w-full" aria-hidden>
            <path
              className="auth-line"
              d="M2 22 C 18 18, 28 8, 42 12 S 68 24, 82 10 S 96 6, 98 8"
              fill="none"
              stroke="#6E92F2"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </GlassCard>
      ) : null}

      <ProductWindow title="woloyem.app / leads · démo" compact={compact}>
        <p className="text-[11px] font-semibold tracking-wide text-[#5E6D7E] uppercase">Pipeline illustratif</p>
        <ul className={cn(compact ? "mt-2.5 space-y-2" : "mt-3 space-y-2.5")}>
          {leads.map((lead, i) => (
            <li
              key={lead.name}
              className={cn(
                "auth-lead flex items-center gap-3 rounded-xl border p-2.5",
                `auth-lead-${i + 1}`,
                lead.highlight
                  ? "border-[#2E5DE6]/40 bg-[#E6EDFD] ring-2 ring-[#2E5DE6]/15"
                  : "border-[#D5E0F8] bg-[#F7F8FC]",
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#E7EEF5] text-[11px] font-semibold text-[#071039]">
                {initials(lead.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#071039]">{lead.name}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E7EEF5]">
                  <div
                    className={cn("auth-score-fill h-full rounded-full bg-[#2E5DE6]", `auth-score-${i + 1}`)}
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-semibold tabular-nums text-[#071039]">{lead.score} %</p>
                <span
                  className={cn(
                    "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    lead.badge === "Chaud"
                      ? "bg-[#F6E4E1] text-[#8D3B32]"
                      : lead.badge === "Tiède"
                        ? "bg-[#F8F1DE] text-[#7A5E22]"
                        : "bg-[#E7EEF5] text-[#5E6D7E]",
                  )}
                >
                  {lead.badge}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </ProductWindow>
    </SceneStage>
  )
}

function SceneAnalytics({ compact }: { compact?: boolean }) {
  return (
    <SceneStage compact={compact}>
      {!compact ? (
        <GlassCard className="auth-float-card-2 absolute bottom-2 left-2 w-[124px] xl:left-3">
          <p className="text-[10px] text-white/65">Conversion</p>
          <p className="mt-1 text-[18px] font-semibold tabular-nums">24 %</p>
        </GlassCard>
      ) : null}

      <ProductWindow title="woloyem.app / analytics · démo" compact={compact}>
        <div className={cn("grid grid-cols-3", compact ? "gap-2" : "gap-2.5")}>
          {[
            { label: "Complétions", value: "128" },
            { label: "Leads", value: "86" },
            { label: "Score moy.", value: "71 %" },
          ].map((kpi, i) => (
            <div
              key={kpi.label}
              className={cn("auth-kpi rounded-xl border border-[#E8EEF3] bg-[#FAFBFC] p-2.5", `auth-kpi-${i + 1}`)}
            >
              <p className="text-[9px] font-medium tracking-wide text-[#5E6D7E] uppercase">{kpi.label}</p>
              <p className="mt-1 text-[15px] font-semibold tabular-nums text-[#071039]">{kpi.value}</p>
            </div>
          ))}
        </div>
        <div className={cn("grid grid-cols-[1.25fr_0.75fr]", compact ? "mt-2.5 gap-2" : "mt-3.5 gap-3")}>
          <div className="rounded-xl border border-[#E8EEF3] bg-[#FAFBFC] p-2.5">
            <svg viewBox="0 0 160 72" className={cn("w-full", compact ? "h-14" : "h-[72px]")} aria-hidden>
              <path
                className="auth-line"
                d="M8 52 C 28 48, 36 28, 52 34 S 84 58, 100 40 S 132 18, 152 22"
                fill="none"
                stroke="#2E5DE6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {[28, 44, 36, 52, 40].map((h, i) => (
                <rect
                  key={i}
                  className={`auth-bar auth-bar-${i + 1}`}
                  x={14 + i * 28}
                  y={72 - h}
                  width="14"
                  height={h}
                  rx="3"
                  fill={i === 3 ? "#071039" : "#6E92F2"}
                  opacity={0.9}
                />
              ))}
            </svg>
          </div>
          <div className="flex items-center justify-center rounded-xl border border-[#E8EEF3] bg-[#FAFBFC] p-2">
            <svg viewBox="0 0 72 72" className={compact ? "size-14" : "size-[4.75rem]"} aria-hidden>
              <circle cx="36" cy="36" r="22" fill="none" stroke="#E7EEF5" strokeWidth="10" />
              <circle
                className="auth-donut"
                cx="36"
                cy="36"
                r="22"
                fill="none"
                stroke="#2E5DE6"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="138"
                transform="rotate(-90 36 36)"
              />
              <text x="36" y="39" textAnchor="middle" className="fill-[#071039] text-[11px] font-semibold">
                64%
              </text>
            </svg>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] tracking-wide text-[#8A96A3] uppercase">Données de démonstration</p>
      </ProductWindow>
    </SceneStage>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export type { AuthSceneId }
