/**
 * Lot 17A — brand-300 as text fails WCAG AA on light surfaces (~2.8:1).
 * Prefer brand-700 in light; keep brand-300 in dark.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs"
import { join } from "node:path"

const roots = ["app", "components", "lib"]
const skip = /node_modules|scorecard-themes|assessment[/\\]themes/
const from = "text-[color:var(--brand-300)]"
const to = "text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)]"

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (skip.test(p)) continue
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(name)) out.push(p)
  }
  return out
}

let updated = 0
for (const root of roots) {
  for (const file of walk(root)) {
    let text = readFileSync(file, "utf8")
    if (!text.includes(from)) continue
    // Idempotent: don't double-wrap
    const placeholder = "__AA_ACCENT__"
    text = text.split(to).join(placeholder)
    text = text.split(from).join(to)
    text = text.split(placeholder).join(to)
    writeFileSync(file, text)
    updated += 1
    console.log(file)
  }
}
console.log(`Updated files: ${updated}`)
