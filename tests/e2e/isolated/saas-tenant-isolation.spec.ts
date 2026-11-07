import { randomBytes } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { e2eAdminClient, seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"

/**
 * Two-organization isolation: org A must not read org B scorecards / leads via URL or client.
 */
test.describe("SaaS multi-tenant isolation", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(180_000)

  let orgA: E2eFixtureBundle
  let orgB: {
    organizationId: string
    scorecardId: string
    leadId: string
    owner: { email: string; password: string; userId: string }
  }

  test.beforeAll(async () => {
    orgA = await seedIsolatedFixtures()
    orgB = await seedSecondOrganization(orgA.prefix)
  })

  test.afterAll(async () => {
    if (!ready || !orgB) return
    const admin = e2eAdminClient()
    await admin.from("scorecards").delete().eq("id", orgB.scorecardId)
    await admin.from("organizations").delete().eq("id", orgB.organizationId)
    await admin.auth.admin.deleteUser(orgB.owner.userId)
  })

  test("owner A cannot open scorecard or lead of org B by direct URL", async ({ page }) => {
    await loginAs(page, orgA, "owner")
    await page.goto(`/dashboard/scorecards/${orgB.scorecardId}`)
    await expect(page.getByText(/introuvable|non trouvé|accès|permission|refusé|404/i).first()).toBeVisible({
      timeout: 20_000,
    })
    await page.goto(`/dashboard/leads/${orgB.leadId}`)
    await expect(page.getByText(/introuvable|non trouvé|accès|permission|refusé|404/i).first()).toBeVisible({
      timeout: 20_000,
    })
  })

  test("anon client as owner A cannot select org B rows via Supabase", async () => {
    const client = createClient(process.env.E2E_SUPABASE_URL!, process.env.E2E_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const signed = await client.auth.signInWithPassword({
      email: orgA.users.owner.email,
      password: orgA.users.owner.password,
    })
    expect(signed.error).toBeFalsy()

    const cards = await client.from("scorecards").select("id").eq("id", orgB.scorecardId)
    expect(cards.error).toBeFalsy()
    expect(cards.data ?? []).toHaveLength(0)

    const leads = await client.from("leads").select("id").eq("id", orgB.leadId)
    expect(leads.error).toBeFalsy()
    expect(leads.data ?? []).toHaveLength(0)

    const members = await client.from("organization_members").select("user_id").eq("organization_id", orgB.organizationId)
    expect(members.error).toBeFalsy()
    expect(members.data ?? []).toHaveLength(0)
  })
})

async function seedSecondOrganization(prefix: string) {
  const admin = e2eAdminClient()
  const password = randomBytes(18).toString("base64url")
  const slug = `${prefix.toLowerCase()}-b`
  const email = `${prefix.toLowerCase()}-owner-b@example.com`

  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existing = listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
  let userId: string
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: `${prefix} Owner B` },
    })
    userId = existing.id
  } else {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `${prefix} Owner B` },
    })
    if (created.error || !created.data.user) {
      throw new Error(`org B user create failed (${created.error?.message ?? "unknown"})`)
    }
    userId = created.data.user.id
  }
  await admin.from("profiles").upsert({ id: userId, email, full_name: `${prefix} Owner B` }, { onConflict: "id" })

  const member = createClient(process.env.E2E_SUPABASE_URL!, process.env.E2E_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const signed = await member.auth.signInWithPassword({ email, password })
  if (signed.error) throw new Error(`org B session failed (${signed.error.message})`)

  const org = await member.rpc("create_organization", {
    p_name: `${prefix}-B`,
    p_slug: slug,
    p_use_case: "e2e-isolation-b",
    p_trial_days: 0,
  })
  if (org.error || !org.data) throw new Error(`org B create failed (${org.error?.message ?? "unknown"})`)
  const organizationId = org.data as string

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

  const card = await admin
    .from("scorecards")
    .insert({
      organization_id: organizationId,
      name: `${prefix} Scorecard B`,
      slug: `${slug}-card`,
      description: "Isolation fixture B",
      status: "draft",
      created_by: userId,
    })
    .select("id")
    .single()
  if (card.error || !card.data) throw new Error(`org B scorecard failed (${card.error?.message ?? "unknown"})`)

  const respondent = await admin
    .from("respondents")
    .insert({
      organization_id: organizationId,
      email: `${prefix.toLowerCase()}-lead-b@example.com`,
      first_name: "Iso",
      last_name: "B",
      country: "FR",
    })
    .select("id")
    .single()
  if (respondent.error || !respondent.data) throw new Error(`org B respondent failed`)

  const lead = await admin
    .from("leads")
    .insert({
      organization_id: organizationId,
      scorecard_id: card.data.id,
      respondent_id: respondent.data.id,
      source: "e2e-isolation",
      status: "new",
    })
    .select("id")
    .single()
  if (lead.error || !lead.data) throw new Error(`org B lead failed`)

  return {
    organizationId,
    scorecardId: card.data.id,
    leadId: lead.data.id,
    owner: { email, password, userId },
  }
}
