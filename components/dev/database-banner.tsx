import { activeDatabaseBannerText, activeDatabaseLabel } from "@/lib/env/active-database"

/** Dev-only ribbon: this process must be on the single allowed staging base. */
export function DevDatabaseBanner() {
  if (process.env.NODE_ENV !== "development") return null

  const label = activeDatabaseLabel()
  const ok = label === "STAGING"

  return (
    <div
      role="status"
      className={`sticky top-0 z-[100] flex items-center justify-center gap-2 px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide ${
        ok ? "bg-emerald-700 text-white" : "bg-rose-800 text-white"
      }`}
    >
      <span>{ok ? activeDatabaseBannerText() : `BASE REFUSÉE : ${label} (staging hzn… requis)`}</span>
    </div>
  )
}
