import { addDomain, removeDomain, verifyDomain } from "@/actions/organization"
import { can } from "@/lib/auth/permissions"
import { loadEntitlements } from "@/lib/billing/account"
import { hasFeature } from "@/lib/billing/entitlements"
import { activeDomainProvider } from "@/lib/domains/provider"
import { requireUser } from "@/lib/auth/session"
import { ensureMembership } from "@/lib/data/membership"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = { title: "Domaines" }

const panel = "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)] md:p-6"
const field = "h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/25"

export default async function DomainsPage() {
  await requireUser()
  const membership = await ensureMembership()
  if (!membership || !can({ role: membership.role }, "team.manage")) {
    return <p className={`${panel} text-sm text-muted-foreground`}>Permission refusée.</p>
  }
  const entitlements = await loadEntitlements(membership.organization.id)
  const allowed = hasFeature(entitlements, "custom_domain")
  const provider = activeDomainProvider()
  let domains: { id: string; domain: string; status: string; verification_token: string }[] = []
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("custom_domains").select("id, domain, status, verification_token").eq("organization_id", membership.organization.id)
    domains = data ?? []
  } catch {
    domains = []
  }
  return (
    <div className="space-y-4">
      <section className={panel}>
        <h2 className="text-base font-semibold text-foreground">Domaines</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Les adresses `/s/[slug]` restent disponibles. Un domaine vérifié sert la scorecard sur l&apos;hôte du client, sans redirection.
        </p>
        {process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID ? (
          <p className="mt-3 text-sm text-muted-foreground">Le provisionnement SSL est géré par Vercel.</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">L&apos;automatisation des domaines Vercel n&apos;est pas configurée.</p>
        )}
        {allowed ? (
          <form
            action={async (formData) => {
              "use server"
              await addDomain(formData)
            }}
            className="mt-5 flex flex-wrap gap-2"
          >
            <input name="domain" placeholder="score.client.com" className={field} />
            <input name="default_slug" placeholder="slug par défaut" className={field} />
            <button className="h-10 rounded-xl bg-[color:var(--brand-950)] px-4 text-sm font-semibold text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]" type="submit">
              Ajouter
            </button>
          </form>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            Les domaines personnalisés sont disponibles à partir du plan Business.{" "}
            <a className="font-medium text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)] underline" href="/dashboard/settings/billing">
              Voir la facturation
            </a>
          </p>
        )}
      </section>
      <ul className="space-y-3">
        {domains.map((domain) => {
          const instructions = provider.instructions(domain.domain, domain.verification_token)
          return (
            <li key={domain.id} className={`${panel} text-sm`}>
              <p className="font-medium text-foreground">
                {domain.domain} · {domain.status}
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {instructions.record} {instructions.host} {instructions.value}
              </p>
              <div className="mt-3 flex gap-4">
                <form
                  action={async () => {
                    "use server"
                    await verifyDomain(domain.id)
                  }}
                >
                  <button className="font-medium text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)] underline" type="submit">
                    Vérifier
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server"
                    await removeDomain(domain.id)
                  }}
                >
                  <button className="font-medium text-destructive underline" type="submit">
                    Retirer
                  </button>
                </form>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
