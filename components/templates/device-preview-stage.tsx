"use client"

import { DeviceFrame, type PreviewDevice } from "@/components/templates/device-frames"
import { cn } from "@/lib/utils"

export type { PreviewDevice }

/**
 * Shared Desktop (Mac) / Tablet (iPad) / Mobile (iPhone 18 Pro) preview chrome.
 * Applies only to the outer stage — never recolors public theme content.
 */
export function DevicePreviewStage({
  device,
  children,
  className,
}: {
  device: PreviewDevice
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-preview-stage={device}
      className={cn(
        "flex w-full justify-center bg-muted/50 px-3 py-5 sm:px-5 sm:py-8 dark:bg-muted/30",
        className,
      )}
    >
      <DeviceFrame device={device}>{children}</DeviceFrame>
    </div>
  )
}
