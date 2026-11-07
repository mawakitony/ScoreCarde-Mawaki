"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { formatNumber } from "@/lib/format"

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function formatValue(value: number, format: "integer" | "plain") {
  if (format === "integer") return formatNumber(Math.round(value))
  return String(Math.round(value))
}

/** Animates a numeric display once after mount. Does not loop. Format is a serializable key. */
export function AnimatedNumber({
  value,
  format = "integer",
  durationMs = 700,
}: {
  value: number
  format?: "integer" | "plain"
  durationMs?: number
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isClient || reduced || !Number.isFinite(value)) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - t) ** 3
      setDisplay(value * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isClient, reduced, value, durationMs])

  if (!isClient || reduced || !Number.isFinite(value)) {
    return <span>{formatValue(value, format)}</span>
  }

  return <span>{formatValue(display, format)}</span>
}
