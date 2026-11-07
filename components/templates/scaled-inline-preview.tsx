"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Renders children at a fixed design width, then scales uniformly into the host.
 * Used by builder side-panels so container queries see a real desktop width (not ~360px).
 */
export function ScaledInlinePreview({
  designWidth = 1180,
  className,
  children,
}: {
  designWidth?: number
  className?: string
  children: React.ReactNode
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(720)

  useEffect(() => {
    const host = hostRef.current
    const content = contentRef.current
    if (!host || !content) return

    const update = () => {
      const width = host.clientWidth || designWidth
      setScale(Math.min(1, width / designWidth))
      setContentHeight(content.scrollHeight || 720)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(host)
    ro.observe(content)
    return () => ro.disconnect()
  }, [designWidth])

  return (
    <div ref={hostRef} className={className} data-scaled-inline-preview="">
      <div className="relative w-full overflow-hidden" style={{ height: contentHeight * scale }}>
        <div
          ref={contentRef}
          style={{
            width: designWidth,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
