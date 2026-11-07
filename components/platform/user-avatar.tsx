import { cn } from "@/lib/utils"

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "?"
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function UserAvatar({
  name,
  email,
  size = "md",
}: {
  name?: string | null
  email?: string | null
  size?: "sm" | "md"
}) {
  const dim = size === "sm" ? "size-8 text-[10px]" : "size-9 text-[11px]"
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[color:var(--pa-primary)]/12 font-bold text-[color:var(--pa-primary)]",
        dim,
      )}
      aria-hidden
    >
      {initials(name, email)}
    </span>
  )
}
