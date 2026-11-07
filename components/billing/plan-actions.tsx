"use client"

import { useState } from "react"
import { CreditCard } from "lucide-react"
import { openBillingPortal, startCheckout } from "@/actions/billing"
import type { BillingInterval, PlanId } from "@/lib/billing/plans"
import { WS_FOCUS } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export function PlanActions({
  plan,
  interval,
  label,
  current = false,
}: {
  plan: PlanId
  interval: BillingInterval
  label?: string
  current?: boolean
}) {
  const [error, setError] = useState("")
  async function checkout() {
    const result = await startCheckout(plan, interval)
    if ("url" in result && result.url) window.location.href = result.url
    else
      setError(
        "error" in result
          ? (result.error ?? "Les informations de facturation sont temporairement indisponibles.")
          : "Les informations de facturation sont temporairement indisponibles.",
      )
  }
  if (current) {
    return (
      <p className="text-[13px] font-semibold text-[color:var(--brand-500)]">Plan actuel</p>
    )
  }
  return (
    <div>
      <button
        type="button"
        className={cn(
          "inline-flex h-9 items-center rounded-xl border border-border bg-background px-4 text-[13px] font-semibold text-foreground",
          "hover:bg-muted/60",
          WS_FOCUS,
        )}
        onClick={() => void checkout()}
      >
        {label ?? "Choisir"}
      </button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

export function PortalButton() {
  const [error, setError] = useState("")
  async function open() {
    const result = await openBillingPortal()
    if ("url" in result && result.url) window.location.href = result.url
    else
      setError(
        "error" in result
          ? (result.error ?? "Les informations de facturation sont temporairement indisponibles.")
          : "Les informations de facturation sont temporairement indisponibles.",
      )
  }
  return (
    <div>
      <button
        type="button"
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-xl bg-[color:var(--brand-950)] px-4 text-[13px] font-semibold text-white",
          "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
          WS_FOCUS,
        )}
        onClick={() => void open()}
      >
        <CreditCard className="size-4" aria-hidden />
        Gérer la facturation
      </button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
