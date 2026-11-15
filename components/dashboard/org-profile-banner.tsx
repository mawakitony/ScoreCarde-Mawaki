import Link from "next/link"
import { isOrgProfileComplete, orgProfileMissingFields, type OrgProfileFields } from "@/lib/onboarding/profile-complete"

export function OrgProfileBanner({ org }: { org: OrgProfileFields }) {
  if (isOrgProfileComplete(org)) return null
  const missing = orgProfileMissingFields(org)
  return (
    <div
      className="mb-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-50"
      role="status"
    >
      <p className="font-medium">Complétez le profil de votre entreprise</p>
      <p className="mt-1 text-[13px] opacity-90">
        Champs manquants : {missing.join(", ")}.{" "}
        <Link href="/dashboard/settings/organization" className="font-semibold underline-offset-2 hover:underline">
          Compléter maintenant
        </Link>
      </p>
    </div>
  )
}
