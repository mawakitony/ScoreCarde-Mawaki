import { ScoreAppSurface } from "@/components/theme/scoreapp-surface"

/**
 * Bare shell for design previews (no dashboard chrome).
 * Auth not required: content is catalog demo only — enables gallery iframes
 * and Playwright visual checks without writing to Supabase.
 * Forced light island so dashboard Dark mode never recolors catalog demos.
 */
export default function ThemePreviewLayout({ children }: { children: React.ReactNode }) {
  return <ScoreAppSurface className="min-h-screen">{children}</ScoreAppSurface>
}
