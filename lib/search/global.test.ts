import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_LIMIT,
  belongsToOrganization,
  displayEmail,
  isActiveLead,
  leadHref,
  leadMatches,
  limitHits,
  memberHref,
  memberMatches,
  nextSearchKey,
  planSearch,
  scorecardHref,
  scorecardMatches,
  searchAccess,
} from "./global.ts"

const action = readFileSync(new URL("../../actions/search.ts", import.meta.url), "utf8")
const field = readFileSync(new URL("../../components/dashboard/global-search.tsx", import.meta.url), "utf8")

test("une scorecard est trouvée par son nom et par son slug", () => {
  const card = { name: "Éligibilité PMP®", slug: "eligibilite-pmp" }
  assert.equal(scorecardMatches(card, "PMP"), true)
  assert.equal(scorecardMatches(card, "eligibilite-pmp"), true)
  assert.equal(scorecardHref("card-1"), "/dashboard/scorecards/card-1")
})

test("un lead est trouvé par prénom, nom, email, téléphone et entreprise", () => {
  const person = {
    first_name: "Jean",
    last_name: "Dupont",
    email: "jean.dupont@example.com",
    phone: "+33601020304",
    company: "Woloyem",
  }
  assert.equal(leadMatches(person, "Jean", true), true)
  assert.equal(leadMatches(person, "Dupont", true), true)
  assert.equal(leadMatches(person, "jean.dupont@", true), true)
  assert.equal(leadMatches(person, "010203", true), true)
  assert.equal(leadMatches(person, "Woloyem", false), true)
  assert.equal(leadMatches(person, "010203", false), false)
  assert.equal(leadHref("lead-1"), "/dashboard/leads/lead-1")
})

test("un membre est trouvé par nom ou email", () => {
  const member = { fullName: "Tony", email: "tony@example.com" }
  assert.equal(memberMatches(member, "Tony"), true)
  assert.equal(memberMatches(member, "tony@example"), true)
  assert.equal(memberHref("user-1"), "/dashboard/settings/team?member=user-1")
})

test("un lead supprimé et une autre organisation sont exclus", () => {
  assert.equal(isActiveLead(null), true)
  assert.equal(isActiveLead("2026-09-28T00:00:00Z"), false)
  assert.equal(belongsToOrganization("org-a", "org-a"), true)
  assert.equal(belongsToOrganization("org-a", "org-b"), false)
  assert.match(action, /\.is\("deleted_at", null\)/)
  assert.match(action, /isActiveLead\(lead\.deleted_at\)/)
  assert.match(action, /belongsToOrganization\(organizationId/)
  assert.doesNotMatch(action, /organizationId\?:/)
  assert.match(action, /searchWorkspace\(query: string\)/)
})

test("moins de 2 caractères ne prépare aucune recherche", () => {
  assert.equal(planSearch(""), null)
  assert.equal(planSearch("a"), null)
  assert.equal(planSearch(" a "), null)
  assert.deepEqual(planSearch("ab"), { term: "ab" })
  const gate = action.indexOf("if (!plan)")
  const client = action.indexOf("createClient(")
  assert.ok(gate >= 0 && client > gate)
  assert.equal(action.includes("audit_logs"), false)
  assert.equal(action.includes("listScorecards"), false)
  assert.equal(action.includes("createAdminClient"), false)
})

test("chaque groupe est limité à 5 résultats", () => {
  const hits = limitHits(["a", "b", "c", "d", "e", "f", "g"])
  assert.equal(hits.length, SEARCH_LIMIT)
  assert.deepEqual(hits, ["a", "b", "c", "d", "e"])
  assert.match(action, /limitHits\(/)
})

test("le viewer, l'editor et l'analyst ne reçoivent pas les membres", () => {
  for (const role of ["viewer", "editor", "analyst", "member"]) {
    const access = searchAccess(role)
    assert.equal(access.members, false)
    assert.equal(access.leads, true)
    assert.equal(access.scorecards, true)
    assert.equal(access.fullEmail, false)
  }
  for (const role of ["owner", "admin"]) {
    const access = searchAccess(role)
    assert.equal(access.members, true)
    assert.equal(access.leads, true)
    assert.equal(access.fullEmail, true)
  }
  assert.match(action, /access\.members \? searchMembers/)
  assert.equal(displayEmail("jean.dupont@example.com", false), "j***@example.com")
  assert.equal(displayEmail("jean.dupont@example.com", true), "jean.dupont@example.com")
})

test("Escape ferme le panneau et Enter ouvre le résultat actif", () => {
  const open = { open: true, index: 0, count: 2 }
  assert.deepEqual(nextSearchKey(open, "Escape"), { open: false, index: 0, count: 2, activate: false })
  assert.deepEqual(nextSearchKey(open, "ArrowDown"), { open: true, index: 1, count: 2, activate: false })
  assert.deepEqual(nextSearchKey({ open: true, index: 1, count: 2 }, "Enter"), { open: false, index: 1, count: 2, activate: true })
  assert.equal(nextSearchKey({ open: false, index: 1, count: 2 }, "Enter").activate, false)
  assert.equal(SEARCH_DEBOUNCE_MS, 300)
  assert.match(field, /SEARCH_DEBOUNCE_MS/)
  assert.match(field, /term\.length < SEARCH_MIN_LENGTH/)
  assert.match(field, /Rechercher dans WOLOYEM Score/)
  assert.match(field, /Impossible d'effectuer la recherche\. Réessayez\./)
  assert.match(field, /Aucun résultat pour/)
})
