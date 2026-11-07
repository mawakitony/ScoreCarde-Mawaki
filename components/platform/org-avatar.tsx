import { orgInitials } from "@/lib/platform/ui"
import { cn } from "@/lib/utils"

export function OrgAvatar({
  name,
  logoUrl,
  size = "md",
}: {
  name: string
  logoUrl?: string | null
  size?: "sm" | "md" | "lg"
}) {
  const dim = size === "sm" ? "size-8 text-[10px]" : size === "lg" ? "size-14 text-lg" : "size-9 text-[11px]"
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote org logos, no fixed domain set
      <img
        src={logoUrl}
        alt=""
        className={cn("shrink-0 rounded-xl object-cover ring-1 ring-border/60", dim)}
      />
    )
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-[color:var(--pa-navy)] font-bold text-white",
        dim,
      )}
      aria-hidden
    >
      {orgInitials(name)}
    </span>
  )
}
