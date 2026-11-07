import Link from "next/link"
import { updatePlatformMaintenanceMessage } from "@/actions/platform"
import { PlatformBtn, PlatformNotice, PlatformPageHeader, PlatformPanel } from "@/components/platform/page-chrome"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { canPlatform } from "@/lib/platform/permissions"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function PlatformSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>
}) {
  const admin = await requirePlatformAdmin("platform.organizations.read")
  const { notice } = await searchParams
  const client = createAdminClient()
  const { data } = await client.from("platform_settings").select("maintenance_message, updated_at").eq("id", 1).maybeSingle()
  const canEdit = canPlatform(admin, "platform.admins.manage")

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Paramètres plateforme"
        description="Configuration, sécurité et maintenance — aucun secret exposé."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Paramètres" }]}
      />

      {notice ? <PlatformNotice message={notice} /> : null}

      <div className="grid gap-3 xl:grid-cols-2">
        <PlatformPanel
          title="Message de maintenance"
          description={`Affiché aux organisations clientes si renseigné. Dernière MAJ : ${data?.updated_at?.slice(0, 19) ?? "—"}`}
        >
          {canEdit ? (
            <form action={saveMaintenance} className="space-y-3">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-[color:var(--pa-ink)]">Message (max. 500)</span>
                <textarea
                  name="message"
                  defaultValue={data?.maintenance_message ?? ""}
                  rows={5}
                  maxLength={500}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus:border-[color:var(--pa-primary)] focus:ring-2 focus:ring-[color:var(--pa-primary)]/20"
                  placeholder="Message optionnel visible côté clients…"
                />
              </label>
              <p className="text-[12px] text-muted-foreground">Laisser vide pour retirer le bandeau. Confirmation via enregistrement.</p>
              <PlatformBtn type="submit">Enregistrer</PlatformBtn>
            </form>
          ) : (
            <p className="rounded-xl border border-border/70 bg-[color:var(--pa-bg)]/50 px-3 py-3 text-sm">
              {data?.maintenance_message || "Aucun message."}
            </p>
          )}
        </PlatformPanel>

        <PlatformPanel title="Sécurité" description="Garde-fous plateforme">
          <ul className="space-y-3 text-sm">
            <SecurityItem
              title="Autorisation"
              body="Table platform_admins uniquement — pas d'allowlist e-mail."
            />
            <SecurityItem
              title="MFA AAL2"
              body={
                <>
                  Obligatoire pour toutes les pages et actions Platform Admin (hors page d&apos;enrôlement MFA).{" "}
                  <Link className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline" href="/platform/security/mfa">
                    Configurer MFA
                  </Link>
                </>
              }
            />
            <SecurityItem title="Actions sensibles" body="Authentification récente + journal d'audit." />
            <SecurityItem title="Secrets" body="Stripe / Brevo restent côté serveur uniquement." />
          </ul>
        </PlatformPanel>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <QuickLink href="/platform/admins" title="Administrateurs" description="Rôles et accès plateforme" />
        <QuickLink href="/platform/notifications" title="Notifications" description="File e-mail transactionnelle" />
        <QuickLink href="/platform/health" title="Santé" description="Monitoring opérationnel" />
      </div>
    </div>
  )
}

function SecurityItem({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-border/70 bg-[color:var(--pa-bg)]/50 px-3.5 py-3">
      <p className="font-semibold text-[color:var(--pa-ink)]">{title}</p>
      <p className="mt-1 text-muted-foreground">{body}</p>
    </li>
  )
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(8,20,59,0.04)] motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5"
    >
      <p className="font-semibold text-[color:var(--pa-ink)]">{title}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
    </Link>
  )
}

async function saveMaintenance(formData: FormData) {
  "use server"
  await updatePlatformMaintenanceMessage(String(formData.get("message") ?? ""))
}
