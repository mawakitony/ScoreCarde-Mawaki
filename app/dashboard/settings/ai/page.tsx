import { activeAiProvider } from "@/lib/ai/provider"
import { saveOrgReportSettings } from "@/actions/reports"
import { canEdit, requireUser } from "@/lib/auth/session"
import { ensureMembership } from "@/lib/data/membership"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "IA" }

const panel = "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)] md:p-6"
const field = "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/25 disabled:opacity-60"

export default async function AiSettingsPage() {
  await requireUser()
  const membership = await ensureMembership()
  if (!membership) return null
  const supabase = await createClient()
  const { data } = await supabase.from("organizations").select("report_settings").eq("id", membership.organization.id).maybeSingle()
  const row = data?.report_settings && typeof data.report_settings === "object" && !Array.isArray(data.report_settings) ? data.report_settings : {}
  const current = {
    brandName: typeof row.brandName === "string" ? row.brandName : "WOLOYEM",
    website: typeof row.website === "string" ? row.website : "",
    email: typeof row.email === "string" ? row.email : "",
    footer: typeof row.footer === "string" ? row.footer : "",
    aiMode: row.aiMode === "manual" || row.aiMode === "automatic" ? row.aiMode : "disabled",
  }
  const provider = activeAiProvider()
  const editor = canEdit(membership.role)
  return (
    <section className={panel}>
      <h2 className="text-base font-semibold text-foreground">IA</h2>
      {provider.configured ? (
        <p className="mt-1 text-sm text-muted-foreground">Provider {provider.id}. L&apos;IA n&apos;écrit aucun score.</p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">L&apos;analyse IA n&apos;est pas configurée.</p>
      )}
      <form
        action={async (formData) => {
          "use server"
          await saveOrgReportSettings({ ...current, aiMode: String(formData.get("aiMode") ?? "disabled") })
        }}
        className="mt-5 space-y-4"
      >
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Mode IA</span>
          <select name="aiMode" defaultValue={current.aiMode} aria-label="Mode IA" disabled={!editor} className={field}>
            <option value="disabled">Désactivée</option>
            <option value="manual">Manuelle</option>
            <option value="automatic">Automatique pour les scorecards qui l&apos;autorisent</option>
          </select>
        </label>
        {editor ? (
          <button type="submit" className="h-10 rounded-xl bg-[color:var(--brand-950)] px-4 text-sm font-semibold text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]">
            Enregistrer
          </button>
        ) : null}
      </form>
    </section>
  )
}
