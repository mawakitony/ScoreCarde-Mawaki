import { safeMetadata } from "@/lib/audit/activity"
import { createAdminClient } from "@/lib/supabase/admin"

export async function writeActivity(input: {
  organizationId: string
  actorId: string | null
  action: string
  metadata?: Record<string, string>
}) {
  const admin = createAdminClient()
  await admin.from("audit_logs").insert({
    organization_id: input.organizationId,
    actor_id: input.actorId,
    action: input.action,
    metadata: safeMetadata(input.metadata ?? {}),
  })
}
