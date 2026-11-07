"use client"

import { useState } from "react"
import { User } from "lucide-react"
import { initials } from "@/lib/format"
import { leadAvatarSeed, leadAvatarTone } from "@/lib/leads/avatar"
import { cn } from "@/lib/utils"

const sizes = {
  sm: "size-8 text-[11px]",
  /** ~36–40 px — table / hot-leads rows */
  row: "size-9 text-xs md:size-10 md:text-[13px]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
  xl: "size-14 text-sm md:size-16 md:text-base",
} as const

/**
 * Lead avatar — photo only when an authorized URL is provided.
 * No Gravatar/Clearbit/email scraping. Initials (or user icon) otherwise.
 */
export function LeadAvatar({
  name,
  email,
  src,
  id,
  size = "md",
  className,
}: {
  name?: string | null
  email?: string | null
  /** Authorized stored photo URL only — never invent. */
  src?: string | null
  id?: string | null
  size?: keyof typeof sizes
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const label = initials(name, email)
  const hasNameOrEmail = Boolean(name?.trim() || email?.trim())
  const showImage = Boolean(src?.trim()) && !failed
  const tone = leadAvatarTone(leadAvatarSeed(name, email, id))

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold leading-none",
        "ring-1 ring-border/70 shadow-[0_0_0_1px_color-mix(in_srgb,var(--border)_40%,transparent)]",
        "motion-safe:transition-[box-shadow,transform] motion-safe:duration-200",
        "motion-safe:hover:ring-[color:var(--brand-500)]/35",
        sizes[size],
        showImage ? "bg-muted" : tone,
        className,
      )}
      aria-hidden={showImage || hasNameOrEmail ? true : undefined}
      title={name?.trim() || email || undefined}
    >
      {showImage ? (
        <>
          {!loaded ? (
            <span className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element -- CRM avatar, arbitrary storage URL */}
          <img
            src={src!}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn("size-full object-cover", !loaded && "opacity-0")}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      ) : hasNameOrEmail ? (
        <span>{label}</span>
      ) : (
        <User className="size-[45%] opacity-80" aria-hidden />
      )}
    </span>
  )
}
