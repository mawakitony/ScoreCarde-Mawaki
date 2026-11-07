"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { inviteMember, removeMember, updateProfile } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WS_FOCUS } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export function ProfileForm({ fullName }: { fullName: string }) {
  const router = useRouter()
  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        const result = await updateProfile(formData)
        if (result.error) toast.error(result.error)
        if (result.message) {
          toast.success(result.message)
          router.refresh()
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} className="h-10 rounded-xl" />
      </div>
      <Button
        type="submit"
        className={cn(
          "h-9 rounded-xl bg-[color:var(--brand-950)] text-white",
          "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
          WS_FOCUS,
        )}
      >
        Enregistrer
      </Button>
    </form>
  )
}

export function InviteForm() {
  const router = useRouter()
  return (
    <form
      className="grid gap-3 md:grid-cols-[1fr_160px_auto]"
      action={async (formData) => {
        const result = await inviteMember(formData)
        if (result.error) toast.error(result.error)
        if (result.message) {
          toast.success(result.message)
          router.refresh()
        }
      }}
    >
      <Input
        name="email"
        type="email"
        required
        placeholder="email@woloyem.com"
        className="h-10 rounded-xl"
        aria-label="Email"
      />
      <select
        name="role"
        className="h-10 rounded-xl border border-border bg-background px-2 text-[13px]"
        defaultValue="member"
        aria-label="Rôle"
      >
        <option value="member">Membre</option>
        <option value="admin">Administrateur</option>
      </select>
      <Button
        type="submit"
        className={cn(
          "h-10 rounded-xl bg-[color:var(--brand-950)] text-white",
          "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
        )}
      >
        Ajouter
      </Button>
    </form>
  )
}

export function RemoveMemberButton({ userId }: { userId: string }) {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 rounded-lg"
      onClick={() => {
        void removeMember(userId).then((result) => {
          if (result.error) toast.error(result.error)
          if (result.message) {
            toast.success(result.message)
            router.refresh()
          }
        })
      }}
    >
      Retirer
    </Button>
  )
}
