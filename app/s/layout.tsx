import { ScoreAppSurface } from "@/components/theme/scoreapp-surface"

/** Public ScoreApps keep their brand surface regardless of dashboard theme preference. */
export default function PublicScorecardLayout({ children }: { children: React.ReactNode }) {
  return <ScoreAppSurface className="min-h-screen">{children}</ScoreAppSurface>
}
