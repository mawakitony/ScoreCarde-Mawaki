import type { ReactNode } from "react"
import { ScoreMotionShowcase } from "@/components/auth/score-motion-showcase"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"

/** Full-viewport split auth shell — edge-to-edge, no outer frame card. */
export function AuthStage({
  children,
  footer,
  mobileMotion,
  className,
}: {
  children: ReactNode
  footer?: ReactNode
  mobileMotion?: ReactNode
  className?: string
}) {
  return (
    <main
      data-auth-stage="fullscreen"
      className={cn("grid min-h-dvh w-full max-w-[100vw] overflow-x-hidden lg:grid-cols-2", className)}
    >
      <section
        data-auth-motion-panel
        className={cn(
          "relative hidden min-h-dvh w-full flex-col overflow-hidden lg:flex",
          "bg-[linear-gradient(135deg,#071039_0%,#0F2270_42%,#1A3BB0_72%,#2E5DE6_100%)]",
          "dark:bg-[linear-gradient(135deg,#071039_0%,#0F2270_50%,#1A3BB0_100%)]",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(110,146,242,0.22),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_85%,rgba(46,93,230,0.2),transparent_45%)]" />
        <div className="relative flex min-h-dvh flex-1 flex-col px-10 py-10 xl:px-14 xl:py-12">
          <ScoreMotionShowcase immersive className="min-h-0 flex-1" />
        </div>
      </section>

      <section
        data-auth-form-panel
        className={cn(
          "relative flex min-h-dvh w-full min-w-0 flex-col overflow-x-hidden bg-[#F7F8FC] dark:bg-[#0B1220]",
          "px-5 py-8 sm:px-8 sm:py-10",
        )}
      >
        {mobileMotion ? (
          <div className="mb-5 w-full min-w-0 overflow-x-hidden lg:hidden" data-auth-mobile-motion>
            {mobileMotion}
          </div>
        ) : null}

        <div className="absolute top-4 right-4 z-20 hidden sm:top-6 sm:right-6 lg:block">
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-4">
          <div className="mb-5 flex justify-end lg:hidden">
            <ThemeToggle />
          </div>
          {children}
          {footer ? <div className="mt-7">{footer}</div> : null}
        </div>
      </section>
    </main>
  )
}
