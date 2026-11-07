"use client"

import { Button } from "@/components/ui/button"

export default function OrganizationSettingsError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-panel)]">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Impossible de charger les paramètres de l&apos;organisation.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Réessayez dans quelques instants.</p>
      <Button className="mt-6 rounded-full" onClick={reset}>Réessayer</Button>
    </div>
  )
}
