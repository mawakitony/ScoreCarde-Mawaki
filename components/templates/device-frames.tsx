import { cn } from "@/lib/utils"

export type PreviewDevice = "desktop" | "tablet" | "mobile"

/**
 * Hardware chrome for catalog / builder previews.
 * Decorative only — never recolors the theme content inside.
 */

export function DeviceFrame({
  device,
  children,
  className,
}: {
  device: PreviewDevice
  children: React.ReactNode
  className?: string
}) {
  if (device === "mobile") return <Iphone18ProFrame className={className}>{children}</Iphone18ProFrame>
  if (device === "tablet") return <IpadFrame className={className}>{children}</IpadFrame>
  return <MacFrame className={className}>{children}</MacFrame>
}

/** iPhone 18 Pro — Dynamic Island, thin titanium-style bezel, home indicator. */
export function Iphone18ProFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-device-frame="iphone-18-pro"
      className={cn("mx-auto w-full max-w-[402px]", className)}
      aria-label="Aperçu iPhone 18 Pro"
    >
      <div
        className={cn(
          "relative rounded-[3.15rem] p-[11px]",
          "bg-[linear-gradient(160deg,#3a3d42_0%,#1c1e22_42%,#0a0b0d_100%)]",
          "shadow-[0_28px_60px_-28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)]",
          "ring-1 ring-black/40",
        )}
      >
        {/* Side buttons (decorative) */}
        <span
          className="absolute top-[118px] -left-[2px] h-8 w-[3px] rounded-l-sm bg-[#2a2d32]"
          aria-hidden
        />
        <span
          className="absolute top-[168px] -left-[2px] h-[52px] w-[3px] rounded-l-sm bg-[#2a2d32]"
          aria-hidden
        />
        <span
          className="absolute top-[232px] -left-[2px] h-[52px] w-[3px] rounded-l-sm bg-[#2a2d32]"
          aria-hidden
        />
        <span
          className="absolute top-[180px] -right-[2px] h-[78px] w-[3px] rounded-r-sm bg-[#2a2d32]"
          aria-hidden
        />

        <div className="relative overflow-hidden rounded-[2.55rem] bg-black">
          {/* Dynamic Island */}
          <div
            className="pointer-events-none absolute top-3 left-1/2 z-20 h-[28px] w-[108px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
            aria-hidden
          >
            <span className="absolute top-1/2 right-3 size-2 -translate-y-1/2 rounded-full bg-[#1a1f2e] ring-1 ring-[#0ea5e9]/30" />
          </div>

          <div
            data-device-screen="iphone-18-pro"
            className="relative isolate min-h-[640px] overflow-hidden bg-white sm:min-h-[720px]"
          >
            {children}
          </div>

          {/* Home indicator */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center"
            aria-hidden
          >
            <span className="h-[4px] w-[108px] rounded-full bg-black/80" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        iPhone 18 Pro
      </p>
    </div>
  )
}

/** iPad — slim bezel, front camera, soft aluminum shell. */
export function IpadFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-device-frame="ipad"
      className={cn("mx-auto w-full max-w-[820px]", className)}
      aria-label="Aperçu iPad"
    >
      <div
        className={cn(
          "relative rounded-[2rem] p-3 sm:p-3.5",
          "bg-[linear-gradient(145deg,#d8dde6_0%,#aeb6c3_48%,#8e97a6_100%)]",
          "shadow-[0_30px_70px_-32px_rgba(15,23,42,0.5),inset_0_1px_0_rgba(255,255,255,0.55)]",
          "ring-1 ring-black/10",
        )}
      >
        <div className="relative overflow-hidden rounded-[1.35rem] bg-black ring-1 ring-black/20">
          {/* Camera */}
          <span
            className="pointer-events-none absolute top-2.5 left-1/2 z-20 size-2 -translate-x-1/2 rounded-full bg-[#1c1f26] ring-1 ring-white/10"
            aria-hidden
          />
          <div
            data-device-screen="ipad"
            className="relative min-h-[560px] overflow-hidden bg-white sm:min-h-[640px]"
          >
            {children}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        iPad
      </p>
    </div>
  )
}

/** Mac — window chrome + laptop base. */
export function MacFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-device-frame="mac"
      className={cn("mx-auto w-full max-w-[1180px]", className)}
      aria-label="Aperçu Mac"
    >
      <div
        className={cn(
          "overflow-hidden rounded-[14px] border border-[#2a2e35]",
          "bg-[#1b1e24]",
          "shadow-[0_36px_80px_-36px_rgba(0,0,0,0.55)]",
        )}
      >
        {/* Title bar */}
        <div className="flex h-10 items-center gap-2 border-b border-white/5 bg-[#23262d] px-3.5">
          <span className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <div className="mx-auto flex h-6 max-w-md flex-1 items-center justify-center rounded-md bg-[#14161b] px-3 text-[11px] text-white/45">
            woloyem.score · aperçu
          </div>
          <span className="w-12" aria-hidden />
        </div>
        <div
          data-device-screen="mac"
          className="relative min-h-[520px] overflow-hidden bg-white sm:min-h-[640px] lg:min-h-[720px]"
        >
          {children}
        </div>
      </div>
      {/* Laptop chin */}
      <div className="relative mx-auto mt-0 h-3 w-[min(100%,104%)] max-w-none">
        <div
          className={cn(
            "mx-auto h-3 w-[102%]",
            "rounded-b-[10px]",
            "bg-[linear-gradient(180deg,#c5cad3_0%,#9aa3b0_100%)]",
            "shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35)]",
          )}
          aria-hidden
        />
        <div
          className="absolute top-0 left-1/2 h-1 w-16 -translate-x-1/2 rounded-b-sm bg-[#7d8694]/70"
          aria-hidden
        />
      </div>
      <p className="mt-3 text-center text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        Mac
      </p>
    </div>
  )
}
