import { randomBytes } from "node:crypto"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"

export type E2eRole = "owner" | "admin" | "viewer"

export type E2eFixtureBundle = {
  prefix: string
  organizationId: string
  scorecardId: string
  scorecardSlug: string
  leadId: string
  users: Record<E2eRole, { email: string; password: string; userId: string }>
}

function requireIsolated() {
  if (!e2eIsolatedAllowed()) {
    throw new Error(`E2E isolation refused: ${e2eIsolatedBlockReason() ?? "unknown"}`)
  }
}

export function e2eAdminClient() {
  requireIsolated()
  return createClient(process.env.E2E_SUPABASE_URL!, process.env.E2E_SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function ensureProfile(admin: SupabaseClient, userId: string, email: string, fullName: string) {
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
    },
    { onConflict: "id" },
  )
  if (error) throw new Error(`E2E profile upsert failed (${error.message})`)
}

async function ensureUser(admin: SupabaseClient, email: string, password: string, fullName: string) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existing = listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true, user_metadata: { full_name: fullName } })
    await ensureProfile(admin, existing.id, email, fullName)
    return existing.id
  }
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (created.error || !created.data.user) throw new Error(`E2E user create failed for role seed (${created.error?.message ?? "unknown"})`)
  await ensureProfile(admin, created.data.user.id, email, fullName)
  return created.data.user.id
}

/** Synthetic fixtures only. Refuses to run unless e2eIsolatedAllowed(). */
export async function seedIsolatedFixtures(): Promise<E2eFixtureBundle> {
  requireIsolated()
  const prefix = process.env.E2E_PREFIX!.trim()
  const slug = `${prefix.toLowerCase()}-card`
  const admin = e2eAdminClient()
  const password = randomBytes(18).toString("base64url")

  const users = {
    owner: { email: `${prefix.toLowerCase()}-owner@example.com`, password, userId: "" },
    admin: { email: `${prefix.toLowerCase()}-admin@example.com`, password, userId: "" },
    viewer: { email: `${prefix.toLowerCase()}-viewer@example.com`, password, userId: "" },
  } as E2eFixtureBundle["users"]

  users.owner.userId = await ensureUser(admin, users.owner.email, password, `${prefix} Owner`)
  users.admin.userId = await ensureUser(admin, users.admin.email, password, `${prefix} Admin`)
  users.viewer.userId = await ensureUser(admin, users.viewer.email, password, `${prefix} Viewer`)

  const member = createClient(process.env.E2E_SUPABASE_URL!, process.env.E2E_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const signed = await member.auth.signInWithPassword({ email: users.owner.email, password })
  if (signed.error) {
    throw new Error(`E2E owner session failed (${signed.error.message})`)
  }

  let organizationId: string | null = null
  const existingOrg = await admin.from("organizations").select("id").eq("slug", prefix.toLowerCase()).maybeSingle()
  if (existingOrg.data?.id) {
    organizationId = existingOrg.data.id
    await admin.from("organization_members").upsert(
      {
        organization_id: organizationId,
        user_id: users.owner.userId,
        role: "owner",
        access_role: "owner",
      },
      { onConflict: "organization_id,user_id" },
    )
  } else {
    const created = await member.rpc("create_organization", {
      p_name: prefix,
      p_slug: prefix.toLowerCase(),
      p_use_case: "e2e-isolated",
      p_trial_days: 0,
    })
    if (created.error || !created.data) throw new Error(`E2E organization create failed (${created.error?.message ?? "unknown"})`)
    organizationId = created.data as string
  }

  await admin.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      provider: "manual",
      plan: "pro",
      billing_interval: "monthly",
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    },
    { onConflict: "organization_id" },
  )

  for (const role of ["admin", "viewer"] as const) {
    await admin.from("organization_members").upsert(
      {
        organization_id: organizationId,
        user_id: users[role].userId,
        role: role === "admin" ? "admin" : "member",
        access_role: role,
      },
      { onConflict: "organization_id,user_id" },
    )
  }

  let scorecardId: string | null = null
  const existingCard = await admin.from("scorecards").select("id").eq("slug", slug).maybeSingle()
  if (existingCard.data?.id) {
    scorecardId = existingCard.data.id
  } else {
    const card = await admin
      .from("scorecards")
      .insert({
        organization_id: organizationId,
        name: `${prefix} Scorecard`,
        slug,
        description: "Synthetic E2E scorecard",
        status: "draft",
        created_by: users.owner.userId,
      })
      .select("id")
      .single()
    if (card.error || !card.data) throw new Error(`E2E scorecard create failed (${card.error?.message ?? "unknown"})`)
    scorecardId = card.data.id
    await admin.from("scorecard_pages").insert({
      scorecard_id: scorecardId,
      title: `${prefix} Landing`,
      subtitle: "Fixture",
      description: "Synthetic landing",
    })
    await admin.from("scorecard_lead_forms").insert({ scorecard_id: scorecardId })
    const question = await admin
      .from("questions")
      .insert({
        scorecard_id: scorecardId,
        title: `${prefix} question`,
        type: "single_choice",
        position: 0,
        is_required: true,
        is_scored: true,
      })
      .select("id")
      .single()
    if (!question.error && question.data) {
      await admin.from("question_options").insert([
        { question_id: question.data.id, label: "Option A", value: "a", score: 10, position: 0 },
        { question_id: question.data.id, label: "Option B", value: "b", score: 20, position: 1 },
      ])
    }
  }

  const leadEmail = `${prefix.toLowerCase()}-lead@example.com`
  let respondentId: string | null = null
  const existingRespondent = await admin
    .from("respondents")
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("email", leadEmail)
    .maybeSingle()
  if (existingRespondent.data?.id) {
    respondentId = existingRespondent.data.id
  } else {
    const respondent = await admin
      .from("respondents")
      .insert({
        organization_id: organizationId,
        email: leadEmail,
        first_name: "E2E",
        last_name: "Lead",
        country: "FR",
      })
      .select("id")
      .single()
    if (respondent.error || !respondent.data) throw new Error(`E2E respondent create failed (${respondent.error?.message ?? "unknown"})`)
    respondentId = respondent.data.id
  }

  let leadId = ""
  const existingLead = await admin
    .from("leads")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("respondent_id", respondentId)
    .maybeSingle()
  if (existingLead.data?.id) {
    leadId = existingLead.data.id
  } else {
    const lead = await admin
      .from("leads")
      .insert({
        organization_id: organizationId,
        scorecard_id: scorecardId,
        respondent_id: respondentId,
        source: "e2e-fixture",
        status: "new",
      })
      .select("id")
      .single()
    if (lead.error || !lead.data) throw new Error(`E2E lead create failed (${lead.error?.message ?? "unknown"})`)
    leadId = lead.data.id
  }

  return {
    prefix,
    organizationId: organizationId!,
    scorecardId: scorecardId!,
    scorecardSlug: slug,
    leadId,
    users,
  }
}

export async function cleanupIsolatedFixtures(prefix = process.env.E2E_PREFIX?.trim() ?? "") {
  requireIsolated()
  if (!/^E2E-WOLOYEM-\d+$/.test(prefix)) throw new Error("Refusing cleanup without E2E_PREFIX")
  const admin = e2eAdminClient()
  const slug = prefix.toLowerCase()
  await admin.from("scorecards").delete().eq("slug", `${slug}-card`)
  await admin.from("organizations").delete().eq("slug", slug)
  const emails = [`${slug}-owner@example.com`, `${slug}-admin@example.com`, `${slug}-viewer@example.com`, `${slug}-lead@example.com`]
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  for (const user of listed.data.users) {
    if (user.email && emails.includes(user.email.toLowerCase())) {
      await admin.auth.admin.deleteUser(user.id)
    }
  }
}
