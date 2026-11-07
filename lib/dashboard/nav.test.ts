import assert from "node:assert/strict"
import test from "node:test"
import { DASHBOARD_NAV, DASHBOARD_NAV_GROUPS, isNavActive, resolveDashboardChrome } from "./nav.ts"

test("dashboard nav groups cover the flat nav list", () => {
  assert.equal(DASHBOARD_NAV_GROUPS.length, 3)
  assert.deepEqual(
    DASHBOARD_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href)),
    DASHBOARD_NAV.map((item) => item.href),
  )
})

test("nav active exact vs prefix", () => {
  assert.equal(isNavActive("/dashboard", { href: "/dashboard", exact: true }), true)
  assert.equal(isNavActive("/dashboard/leads", { href: "/dashboard", exact: true }), false)
  assert.equal(isNavActive("/dashboard/leads/1", { href: "/dashboard/leads", exact: false }), true)
})

test("chrome titles resolve from pathname", () => {
  assert.equal(resolveDashboardChrome("/dashboard").title, "Dashboard")
  assert.equal(resolveDashboardChrome("/dashboard/leads").title, "Leads")
  assert.equal(resolveDashboardChrome("/dashboard/settings/team").title, "Paramètres")
})
