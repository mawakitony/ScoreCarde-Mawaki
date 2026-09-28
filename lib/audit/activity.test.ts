import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { canViewActivity, presentActivity, safeMetadata } from "./activity.ts"

const secret = {
  token: "tok-secret",
  code: "ACCESS-CODE",
  password: "pw-secret",
  api_key: "key-secret",
  email: "person@example.com",
  scorecard_name: "Eligibilite PMP",
  role: "editor",
}

test("le journal est réservé au owner et à l'admin", () => {
  assert.equal(canViewActivity("owner"), true)
  assert.equal(canViewActivity("admin"), true)
  for (const role of ["editor", "analyst", "viewer", "member"]) assert.equal(canViewActivity(role), false)
})

test("la whitelist retire les secrets et garde les détails sûrs", () => {
  const safe = safeMetadata(secret)
  assert.deepEqual(safe, { scorecard_name: "Eligibilite PMP", role: "editor" })
  const shown = presentActivity({
    action: "scorecard.published",
    metadata: { ...secret, target_user_id: "11111111-1111-4111-8111-111111111111" },
    actorName: "Tony",
    memberNames: {},
  })
  const text = JSON.stringify(shown)
  assert.match(shown.action, /Tony a publié/)
  assert.equal(shown.resource, "Eligibilite PMP")
  for (const hidden of ["tok-secret", "ACCESS-CODE", "pw-secret", "key-secret", "person@example.com", "11111111"]) {
    assert.equal(text.includes(hidden), false)
  }
})

test("les événements existants ont un libellé humain", () => {
  const cases = [
    ["member.invited", "Tony a invité un membre"],
    ["member.role_changed", "Mawaki a modifié le rôle d'un membre"],
    ["lead.deleted", "Tony a supprimé un lead"],
    ["lead.restored", "Tony a restauré un lead"],
    ["lead.anonymized", "Tony a anonymisé un lead"],
    ["ownership.transferred", "Tony a transféré la propriété"],
    ["subscription.changed", "Tony a modifié un abonnement"],
  ] as const
  for (const [action, expected] of cases) {
    const actor = expected.startsWith("Mawaki") ? "Mawaki" : "Tony"
    const shown = presentActivity({
      action,
      metadata: action === "member.role_changed" ? { old_role: "editor", new_role: "admin", target_user_id: "22222222-2222-4222-8222-222222222222" } : { plan: "starter" },
      actorName: actor,
      memberNames: { "22222222-2222-4222-8222-222222222222": "Paul" },
    })
    assert.equal(shown.action, expected)
    if (action === "member.role_changed") {
      assert.equal(shown.resource, "Paul")
      assert.equal(shown.details, "Editor → Admin")
    }
  }
  const code = presentActivity({
    action: "member.first_access_regenerated",
    metadata: { role: "viewer", code: "ACCESS-CODE", email: "person@example.com" },
    actorName: "Admin",
    memberNames: {},
  })
  assert.match(code.action, /a régénéré un code de première connexion/)
  assert.equal(JSON.stringify(code).includes("ACCESS-CODE"), false)
  assert.equal(JSON.stringify(code).includes("@"), false)
})

test("la page lit le journal avec la session et les nouvelles écritures sont branchées", () => {
  const page = readFileSync(new URL("../../app/dashboard/settings/activity/page.tsx", import.meta.url), "utf8")
  const query = readFileSync(new URL("../../lib/data/activity.ts", import.meta.url), "utf8")
  const publish = readFileSync(new URL("../../actions/publish.ts", import.meta.url), "utf8")
  const status = readFileSync(new URL("../../actions/scorecards.ts", import.meta.url), "utf8")
  const access = readFileSync(new URL("../../actions/first-access.ts", import.meta.url), "utf8")
  const leads = readFileSync(new URL("../../actions/leads.ts", import.meta.url), "utf8")
  assert.equal(page.includes("createAdminClient"), false)
  assert.equal(query.includes("createAdminClient"), false)
  assert.match(query, /createClient/)
  assert.match(query, /organization_id", membership\.organization\.id/)
  assert.equal(query.includes("searchParams"), false)
  assert.match(publish, /scorecard\.published/)
  assert.match(status, /scorecard\.published/)
  assert.match(access, /member\.first_access_regenerated/)
  assert.match(leads, /lead\.restored/)
  assert.match(leads, /lead\.anonymized/)
  assert.equal(access.includes("metadata: { role: row.role, code"), false)
})
