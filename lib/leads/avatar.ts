/** Soft tonal backgrounds for initials — Lot 16B brand tokens, readable in light and dark. */
const TONES = [
  "bg-[color:var(--brand-950)]/10 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-950)]/30 dark:text-[color:var(--brand-500)]",
  "bg-[color:var(--brand-500)]/12 text-[color:var(--brand-500)] dark:bg-[color:var(--brand-500)]/20 dark:text-[color:var(--brand-500)]",
  "bg-[color:var(--brand-300)]/15 text-[color:var(--brand-700)] dark:bg-[color:var(--brand-300)]/20 dark:text-[color:var(--brand-300)]",
  "bg-muted text-muted-foreground",
  "bg-destructive/10 text-destructive dark:bg-destructive/20",
  "bg-[color:var(--brand-950)]/8 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/12 dark:text-[color:var(--brand-500)]",
] as const

export function leadAvatarTone(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return TONES[hash % TONES.length]!
}

export function leadAvatarSeed(name?: string | null, email?: string | null, id?: string | null) {
  return (name?.trim() || email?.trim() || id || "lead").toLowerCase()
}
