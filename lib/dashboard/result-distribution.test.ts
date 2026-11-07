import assert from "node:assert/strict"
import test from "node:test"
import { share } from "../leads/metrics.ts"
import { displayResultLabel, withDisplayResultLabels } from "./result-labels.ts"

test("empty distribution stays empty", () => {
  assert.deepEqual(withDisplayResultLabels([]), [])
})

test("single category is 100 percent of total", () => {
  const rows = withDisplayResultLabels([{ label: "eligible", count: 4 }])
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  assert.equal(total, 4)
  assert.equal(share(rows[0]!.count, total), 100)
  assert.equal(rows[0]!.label, "Éligible")
})

test("percentages sum approximately to 100 for mixed rows", () => {
  const rows = withDisplayResultLabels([
    { label: "eligible", count: 2 },
    { label: "needs_preparation", count: 1 },
    { label: "Custom Label", count: 1 },
  ])
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  const percents = rows.map((row) => share(row.count, total))
  assert.equal(total, 4)
  assert.ok(Math.abs(percents.reduce((a, b) => a + b, 0) - 100) < 0.2)
  assert.equal(displayResultLabel("Custom Label"), "Custom Label")
})
