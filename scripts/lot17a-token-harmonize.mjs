/**
 * Lot 17A — replace active --brand-navy/teal/gold usages with scale tokens.
 * Keeps alias definitions in globals.css for compatibility.
 * Skips scorecard themes (user-configurable).
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs"
import { join } from "node:path"

const roots = ["app", "components", "lib"]
const skip = /node_modules|scorecard-themes|assessment[/\\]themes|globals\.css/
const pairs = [
  ["var(--brand-navy)", "var(--brand-950)"],
  ["var(--brand-teal)", "var(--brand-500)"],
  ["var(--brand-gold)", "var(--brand-300)"],
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (skip.test(p)) continue
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(tsx?|css)$/.test(name)) out.push(p)
  }
  return out
}

let updated = 0
for (const root of roots) {
  for (const file of walk(root)) {
    let text = readFileSync(file, "utf8")
    const orig = text
    for (const [from, to] of pairs) text = text.split(from).join(to)
    if (text !== orig) {
      writeFileSync(file, text)
      updated += 1
      console.log(file)
    }
  }
}
console.log(`Updated files: ${updated}`)
