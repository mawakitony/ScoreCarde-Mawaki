import { isSupabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { normalizeAccessRole, type AccessRole } from "@/lib/auth/permissions"
import type { Organization } from "@/types/database"

export type Membership = {
  role: AccessRole
  organization: Pick<
    Organization,
    "id" | "name" | "slug" | "logo_url" | "primary_color" | "secondary_color"
  >
}

type JoinedProfile = {
  full_name: string | null
  email: string | null
}

export type OrgMember = {
  userId: string
  role: AccessRole
  fullName: string | null
  email: string | null
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

const MEMBER_COLUMNS =
  "user_id, organization_id, role, access_role, organization:organizations(id, name, slug, logo_url, primary_color, secondary_color)"
const LEGACY_MEMBER_COLUMNS =
  "user_id, organization_id, role, organization:organizations(id, name, slug, logo_url, primary_color, secondary_color)"

function membershipFromRow(data: {
  role: string
  access_role?: string | null
  organization: Membership["organization"] | Membership["organization"][] | null
}) {
  const organization = one(data.organization)
  if (!organization) return null
  return { role: normalizeAccessRole(data.access_role || data.role), organization }
}

export async function getCurrentMembership(organizationId?: string): Promise<Membership | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return null

  const owned = await supabase.from("organization_members").select("organization_id").eq("user_id", userId)
  if (owned.error || owned.data?.length !== 1) return null
  const currentOrganizationId = owned.data[0].organization_id
  if (organizationId && organizationId !== currentOrganizationId) return null

  const selected = await supabase
    .from("organization_members")
    .select(MEMBER_COLUMNS)
    .eq("user_id", userId)
    .eq("organization_id", currentOrganizationId)
    .maybeSingle()
  const data = selected.error
    ? (
        await supabase
          .from("organization_members")
          .select(LEGACY_MEMBER_COLUMNS)
          .eq("user_id", userId)
          .eq("organization_id", currentOrganizationId)
          .maybeSingle()
      ).data
    : selected.data
  if (!data) return null
  return membershipFromRow(data as Parameters<typeof membershipFromRow>[0])
}

export async function getMembership() {
  return getCurrentMembership()
}

export async function ensureMembership() {
  const existing = await getCurrentMembership()
  if (existing) return existing
  if (!isSupabaseConfigured()) return null

  const supabase = await createClient()
  const { error } = await supabase.rpc("bootstrap_membership")
  if (error) return null
  return getCurrentMembership()
}

export async function listMembers(organizationId: string): Promise<OrgMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role, access_role, profile:profiles(full_name, email)")
    .eq("organization_id", organizationId)

  if (error || !data) return []

  return data.map((row) => {
    const profile = one(row.profile as JoinedProfile | JoinedProfile[] | null)
    return {
      userId: row.user_id as string,
      role: normalizeAccessRole(row.access_role || row.role),
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
    }
  })
}
