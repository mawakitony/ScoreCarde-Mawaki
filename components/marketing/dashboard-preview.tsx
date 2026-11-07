import { cn } from "@/lib/utils"

/** Aperçu statique inspiré du dashboard réel — données fictives uniquement. */
export function DashboardPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border border-white/15 bg-[#0B1220] shadow-[0_40px_80px_-40px_rgba(7,16,57,0.85)]",
        className,
      )}
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" />
        <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="size-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-3 text-[11px] font-medium tracking-wide text-white/45">
          app.woloyem.score / dashboard
        </span>
      </div>
      <div className="grid gap-0 md:grid-cols-[11rem_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#071039]/80 p-4 md:block">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#6E92F2] uppercase">Organisation</p>
          <p className="mt-2 text-sm font-semibold text-white">Atelier Démo</p>
          <nav className="mt-6 space-y-2 text-[12px] text-white/65">
            {["Vue d’ensemble", "Scorecards", "Leads", "Analytics", "Équipe", "Facturation"].map((item, i) => (
              <div
                key={item}
                className={cn(
                  "rounded-lg px-2.5 py-1.5",
                  i === 0 ? "bg-white/10 font-semibold text-white" : "hover:bg-white/5",
                )}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#6E92F2] uppercase">Aujourd’hui</p>
              <p className="mt-1 text-lg font-semibold text-white sm:text-xl">Bonjour — aperçu organisation</p>
            </div>
            <span className="rounded-full bg-[#2E5DE6]/25 px-3 py-1 text-[11px] font-semibold text-[#AFC5F8]">
              Essai · 11 j restants
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Scorecards", value: "3" },
              { label: "Réponses", value: "48" },
              { label: "Prospects", value: "27" },
              { label: "Équipe", value: "2" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
                <p className="text-[11px] text-white/50">{kpi.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{kpi.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[12px] font-semibold text-white">Réponses cette semaine</p>
              <div className="mt-4 flex h-24 items-end gap-2">
                {[40, 65, 48, 80, 55, 92, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-[linear-gradient(180deg,#6E92F2_0%,#2E5DE6_100%)] opacity-90"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[12px] font-semibold text-white">Prospects récents</p>
              <ul className="mt-3 space-y-2.5 text-[12px]">
                {[
                  { name: "Camille R.", status: "Nouveau" },
                  { name: "Noah B.", status: "Qualifié" },
                  { name: "Inès M.", status: "Contacté" },
                ].map((lead) => (
                  <li key={lead.name} className="flex items-center justify-between text-white/75">
                    <span>{lead.name}</span>
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-[#AFC5F8]">
                      {lead.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
