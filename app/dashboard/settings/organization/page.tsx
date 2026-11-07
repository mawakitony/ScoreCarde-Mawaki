import { saveOrganization } from "@/actions/organization"
import { can } from "@/lib/auth/permissions"
import { requireUser } from "@/lib/auth/session"
import { ensureMembership } from "@/lib/data/membership"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Organisation" }

const panel = "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)] md:p-6"
const field = "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/25"

export default async function OrganizationSettingsPage() {
  await requireUser()
  const membership = await ensureMembership()
  if (!membership || !can({ role: membership.role }, "team.manage")) {
    return <p className={`${panel} text-sm text-muted-foreground`}>Vous n&apos;avez pas l&apos;autorisation de modifier les paramètres de l&apos;organisation.</p>
  }
  const supabase = await createClient()
  const { data } = await supabase.from("organizations").select("name, slug, website, country, timezone, default_language, footer_text").eq("id", membership.organization.id).maybeSingle()
  return (
    <section className={panel}>
      <h2 className="text-base font-semibold text-foreground">Organisation</h2>
      <p className="mt-1 text-sm text-muted-foreground">Identité et informations générales de l&apos;organisation.</p>
      <form
        action={async (formData) => {
          "use server"
          await saveOrganization(formData)
        }}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        <label className="space-y-1.5 text-sm sm:col-span-1">
          <span className="font-medium text-foreground">Nom</span>
          <input name="name" defaultValue={data?.name ?? ""} className={field} required />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Adresse interne</span>
          <input name="slug" defaultValue={data?.slug ?? ""} className={field} required />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Site web</span>
          <input name="website" defaultValue={data?.website ?? ""} placeholder="https://" className={field} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Pays</span>
          <input name="country" defaultValue={data?.country ?? ""} placeholder="Pays" className={field} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Fuseau</span>
          <input name="timezone" defaultValue={data?.timezone ?? "UTC"} placeholder="UTC" className={field} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Langue</span>
          <select name="language" defaultValue={data?.default_language ?? "fr"} className={field}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-foreground">Pied de page</span>
          <input name="footer" defaultValue={data?.footer_text ?? ""} placeholder="Pied de page" className={field} />
        </label>
        <div className="sm:col-span-2">
          <button className="h-10 rounded-xl bg-[color:var(--brand-950)] px-4 text-sm font-semibold text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]" type="submit">
            Enregistrer
          </button>
        </div>
      </form>
    </section>
  )
}
