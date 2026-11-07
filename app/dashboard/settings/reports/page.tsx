import { saveOrgReportSettings } from "@/actions/reports"
import { canEdit, requireUser } from "@/lib/auth/session"
import { ensureMembership } from "@/lib/data/membership"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

export const metadata = { title: "Rapports" }

const panel = "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)] md:p-6"
const field = "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/25 disabled:opacity-60"

function settings(value: Json | undefined) {
  const row = value && typeof value === "object" && !Array.isArray(value) ? value : {}
  return {
    brandName: typeof row.brandName === "string" ? row.brandName : "WOLOYEM",
    website: typeof row.website === "string" ? row.website : "",
    email: typeof row.email === "string" ? row.email : "",
    footer: typeof row.footer === "string" ? row.footer : "",
    aiMode: row.aiMode === "manual" || row.aiMode === "automatic" ? row.aiMode : "disabled",
  }
}

export default async function ReportSettingsPage() {
  await requireUser()
  const membership = await ensureMembership()
  if (!membership) return null
  const supabase = await createClient()
  const { data } = await supabase.from("organizations").select("report_settings").eq("id", membership.organization.id).maybeSingle()
  const current = settings(data?.report_settings)
  const editor = canEdit(membership.role)
  return (
    <section className={panel}>
      <h2 className="text-base font-semibold text-foreground">Rapports</h2>
      <p className="mt-1 text-sm text-muted-foreground">Marque et coordonnées affichées sur les rapports générés.</p>
      <form
        action={async (formData) => {
          "use server"
          await saveOrgReportSettings({
            brandName: String(formData.get("brandName") ?? ""),
            website: String(formData.get("website") ?? ""),
            email: String(formData.get("email") ?? ""),
            footer: String(formData.get("footer") ?? ""),
            aiMode: current.aiMode,
          })
        }}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Marque</span>
          <input name="brandName" defaultValue={current.brandName} aria-label="Marque" className={field} disabled={!editor} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Site web</span>
          <input name="website" defaultValue={current.website} aria-label="Site" placeholder="Site web" className={field} disabled={!editor} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Email de contact</span>
          <input name="email" defaultValue={current.email} aria-label="Email de contact" placeholder="Email de contact" className={field} disabled={!editor} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Pied de page</span>
          <input name="footer" defaultValue={current.footer} aria-label="Pied de page" placeholder="Pied de page" className={field} disabled={!editor} />
        </label>
        {editor ? (
          <div className="sm:col-span-2">
            <button type="submit" className="h-10 rounded-xl bg-[color:var(--brand-950)] px-4 text-sm font-semibold text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]">
              Enregistrer
            </button>
          </div>
        ) : null}
      </form>
    </section>
  )
}
