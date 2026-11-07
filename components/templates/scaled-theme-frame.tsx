"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** Renders a theme at a fixed design width inside an iframe, then scales uniformly into the host box. */
export function ScaledThemeFrame({
  themeId,
  designWidth = 1280,
  designHeight = 820,
  backgroundColor,
  className,
  title,
}: {
  themeId: string
  designWidth?: number
  designHeight?: number
  /** Theme-specific canvas color while the iframe loads — not a dashboard token. */
  backgroundColor?: string
  className?: string
  title: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const update = () => {
      const width = el.clientWidth || designWidth
      setScale(width / designWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [designWidth])

  return (
    <div ref={hostRef} className={className}>
      <div
        className="relative size-full overflow-hidden"
        style={{ backgroundColor: backgroundColor || "var(--muted)" }}
      >
        {!loaded ? (
          <div
            className="absolute inset-0 animate-pulse bg-muted/60 motion-reduce:animate-none"
            aria-hidden
          />
        ) : null}
        <iframe
          title={title}
          src={`/theme-preview/${themeId}`}
          className={cn(
            "absolute top-0 left-0 border-0 bg-white motion-safe:transition-opacity motion-safe:duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
          style={{
            width: designWidth,
            height: designHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
          loading="lazy"
          tabIndex={-1}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  )
}
