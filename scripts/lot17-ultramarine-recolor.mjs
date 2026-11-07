/**
 * Lot 17 — one-shot recolor of legacy navy/teal/gold hex → Ultramarine.
 * Skips scorecard theme packages (user-configurable). Does not print secrets.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs"
import { join } from "node:path"

const roots = ["app", "components", "lib"]
const skip = /node_modules|scorecard-themes|assessment[/\\]themes/
const pairs = [
  [
    "linear-gradient(160deg,#10243D_0%,#16324F_48%,#2F6F73_100%)",
    "linear-gradient(135deg,#071039_0%,#1A3BB0_48%,#2E5DE6_100%)",
  ],
  [
    "linear-gradient(160deg, #10243D 0%, #16324F 48%, #2F6F73 100%)",
    "linear-gradient(135deg, #071039 0%, #1A3BB0 48%, #2E5DE6 100%)",
  ],
  ["#10243D", "#071039"],
  ["#10243d", "#071039"],
  ["#16324F", "#071039"],
  ["#16324f", "#071039"],
  ["#2F6F73", "#2E5DE6"],
  ["#2f6f73", "#2E5DE6"],
  ["#3A8589", "#1A3BB0"],
  ["#3a8589", "#1A3BB0"],
  ["#C4A15A", "#6E92F2"],
  ["#c4a15a", "#6E92F2"],
  ["#8a7340", "#1A3BB0"],
  ["#8A7340", "#1A3BB0"],
  ["#9FD9D9", "#AFC5F8"],
  ["#9fd9d9", "#AFC5F8"],
  ["#61B2B2", "#6E92F2"],
  ["#61b2b2", "#6E92F2"],
  ["#E8D5A3", "#AFC5F8"],
  ["#e8d5a3", "#AFC5F8"],
  ["#B8923A", "#2E5DE6"],
  ["#b8923a", "#2E5DE6"],
  ["#1d4064", "#1A3BB0"],
  ["rgba(16,36,61,", "rgba(7,16,57,"],
  ["rgba(16, 36, 61,", "rgba(7, 16, 57,"],
  ["rgba(22, 50, 79,", "rgba(7, 16, 57,"],
  ["rgba(22,50,79,", "rgba(7,16,57,"],
  ["rgba(20, 32, 51,", "rgba(7, 16, 57,"],
  ["rgba(20,32,51,", "rgba(7,16,57,"],
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
