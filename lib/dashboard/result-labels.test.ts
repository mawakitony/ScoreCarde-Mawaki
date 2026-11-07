import assert from "node:assert/strict"
import test from "node:test"
import { displayResultLabel, withDisplayResultLabels } from "./result-labels.ts"

test("maps known technical result keys", () => {
  assert.equal(displayResultLabel("needs_preparation"), "Préparation nécessaire")
  assert.equal(displayResultLabel("not_yet_eligible"), "Pas encore éligible")
  assert.equal(displayResultLabel("probably_eligible"), "Probablement éligible")
  assert.equal(displayResultLabel("eligible"), "Éligible")
})

test("keeps configured human labels unchanged", () => {
  assert.equal(displayResultLabel("Excellent"), "Excellent")
  assert.equal(displayResultLabel("À améliorer"), "À améliorer")
})

test("withDisplayResultLabels preserves key and remaps label", () => {
  const rows = withDisplayResultLabels([
    { label: "needs_preparation", count: 3 },
    { label: "Top performer", count: 1 },
  ])
  assert.equal(rows[0]!.key, "needs_preparation")
  assert.equal(rows[0]!.label, "Préparation nécessaire")
  assert.equal(rows[1]!.label, "Top performer")
})
