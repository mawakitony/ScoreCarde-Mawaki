import { activeDatabaseHost, activeDatabaseLabel } from "@/lib/env/active-database"

/** Dev-only ribbon: which Supabase project this process is wired to. */
export function DevDatabaseBanner() {
  if (process.env.NODE_ENV !== "development") return null

  const label = activeDatabaseLabel()
  const host = activeDatabaseHost()
  const tone =
    label === "STAGING"
      ? "bg-emerald-700 text-white"
      : label === "XP"
        ? "bg-amber-700 text-white"
        : "bg-slate-700 text-white"

  return (
    <div
      role="status"
      className={`sticky top-0 z-[100] flex items-center justify-center gap-2 px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide ${tone}`}
    >
      <span>BASE ACTIVE: {label}</span>
      {host ? <span className="font-normal opacity-90">· {host}</span> : null}
    </div>
  )
}
