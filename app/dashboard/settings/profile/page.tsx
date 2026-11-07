import { UserRound } from "lucide-react"
import { ProfileForm } from "@/components/settings/settings-forms"
import { requireUser } from "@/lib/auth/session"
import { WS_ICON_CHIP, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export const metadata = { title: "Profil" }

export default async function ProfileSettingsPage() {
  const user = await requireUser()
  return (
    <section className={cn(WS_PANEL, "p-5 md:p-6")}>
      <div className="flex items-start gap-3">
        <span className={cn(WS_ICON_CHIP, "size-10 rounded-2xl")}>
          <UserRound className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Profil</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="mt-5">
        <ProfileForm fullName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : ""} />
      </div>
    </section>
  )
}
