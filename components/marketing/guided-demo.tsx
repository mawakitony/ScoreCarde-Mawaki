"use client"

import { useState } from "react"
import { CheckCircle2, ChevronRight, Link2, Share2, Users, ClipboardList, Inbox, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    id: "create",
    title: "Créer une scorecard",
    body: "L’équipe définit questions, catégories et seuils. Aucune donnée réelle n’est utilisée ici.",
    icon: ClipboardList,
    mock: "Scorecard « Diagnostic besoins » · brouillon → prête à publier",
  },
  {
    id: "share",
    title: "Partager le lien",
    body: "Un lien public /s/… est généré pour recueillir les réponses hors connexion admin.",
    icon: Share2,
    mock: "Lien partagé · thème d’évaluation · consentement collecté",
  },
  {
    id: "reply",
    title: "Recevoir une réponse",
    body: "Le participant termine le parcours. Le scoring calcule le résultat selon vos règles.",
    icon: Link2,
    mock: "Session terminée · score 72 · résultat « Orienté »",
  },
  {
    id: "crm",
    title: "Prospect dans le CRM",
    body: "Selon la capture d’identité de la scorecard, le lead apparaît dans l’espace de l’organisation.",
    icon: Inbox,
    mock: "Lead « Alex D. » · statut Nouveau · lié à la scorecard",
  },
  {
    id: "follow",
    title: "Suivre les résultats",
    body: "Analytics et fiches permettent de suivre réponses, scores et activité récente.",
    icon: BarChart3,
    mock: "Vue analytics · répartition des résultats · activité du jour",
  },
  {
    id: "team",
    title: "Collaborer en équipe",
    body: "Le propriétaire invite des collaborateurs : ils rejoignent la même organisation et le même abonnement.",
    icon: Users,
    mock: "Invitation envoyée · rôle MEMBER · même organisation",
  },
] as const

export function GuidedDemo() {
  const [active, setActive] = useState(0)
  const step = STEPS[active]
  const Icon = step.icon

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
      <ol className="space-y-2">
        {STEPS.map((item, index) => {
          const StepIcon = item.icon
          const selected = index === active
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-[background-color,border-color,transform] duration-200",
                  selected
                    ? "border-[#2E5DE6]/45 bg-[#2E5DE6]/8 shadow-[0_12px_28px_-22px_rgba(7,16,57,0.45)]"
                    : "border-border/80 bg-card/60 hover:border-[#2E5DE6]/25 hover:bg-card",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
                    selected ? "bg-[#071039] text-white" : "bg-muted text-foreground",
                  )}
                >
                  <StepIcon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold tracking-[0.14em] text-[#1A3BB0] uppercase dark:text-[#6E92F2]">
                      Étape {index + 1}
                    </span>
                    {selected ? <CheckCircle2 className="size-3.5 text-[#2E5DE6]" aria-hidden /> : null}
                  </span>
                  <span className="mt-1 block text-[15px] font-semibold text-[#071039] dark:text-[#F5F7FA]">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">
                    {item.body}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div
        key={step.id}
        className="rounded-[1.5rem] border border-[#071039]/10 bg-[linear-gradient(160deg,#071039_0%,#1A3BB0_55%,#2E5DE6_100%)] p-6 text-white shadow-[0_28px_60px_-36px_rgba(7,16,57,0.7)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-400 dark:border-white/10"
      >
        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/15">
          <Icon className="size-5" aria-hidden />
        </div>
        <p className="mt-5 text-[12px] font-semibold tracking-[0.16em] text-[#AFC5F8] uppercase">
          Démonstration guidée
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">{step.title}</h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85">{step.body}</p>
        <div className="mt-8 rounded-2xl border border-white/15 bg-black/20 p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#AFC5F8] uppercase">Aperçu fictif</p>
          <p className="mt-2 text-sm leading-relaxed text-white/90">{step.mock}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-semibold text-[#071039] transition-transform hover:-translate-y-px"
            onClick={() => setActive((v) => Math.min(v + 1, STEPS.length - 1))}
            disabled={active >= STEPS.length - 1}
          >
            Étape suivante
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-xl border border-white/25 px-4 text-[13px] font-semibold text-white/90 hover:bg-white/10"
            onClick={() => setActive(0)}
          >
            Revenir au début
          </button>
        </div>
      </div>
    </div>
  )
}
