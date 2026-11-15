import fs from "fs"
import path from "path"

const roots = ["app", "components", "lib", "actions"]
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".html", ".json"])

const replacements = [
  [/WOLOYEM SCORE/g, "Mawaki Score"],
  [/WOLOYEM Score/g, "Mawaki Score"],
  [/Woloyem Score/g, "Mawaki Score"],
  [/woloyem score/g, "mawaki score"],
]

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "design-references") continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (exts.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

const changed = []
for (const root of roots) {
  const abs = path.join(process.cwd(), root)
  if (!fs.existsSync(abs)) continue
  for (const file of walk(abs)) {
    const before = fs.readFileSync(file, "utf8")
    let after = before
    for (const [re, to] of replacements) after = after.replace(re, to)
    if (after !== before) {
      fs.writeFileSync(file, after)
      changed.push(path.relative(process.cwd(), file).replaceAll("\\", "/"))
    }
  }
}

console.log(`CHANGED=${changed.length}`)
for (const f of changed) console.log(f)
