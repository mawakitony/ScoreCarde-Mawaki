import fs from "node:fs"
import path from "node:path"

const roots = [
  "components/dashboard",
  "components/leads",
  "components/analytics",
  "components/assistant",
  "components/settings",
  "components/templates",
  "components/scorecard",
  "components/guide",
  "components/billing",
  "components/scorecard-builder",
  "app/dashboard",
]

function skip(p) {
  return p.includes(`${path.sep}assessment${path.sep}themes`) || p.includes("theme-preview")
}

const pairs = [
  [/bg-\[#F7F8FA\]/g, "bg-background"],
  [/hover:bg-\[#F7F8FA\]/g, "hover:bg-muted"],
  [/bg-\[#F3F4F6\]/g, "bg-muted"],
  [/border-\[#E7E9EE\]/g, "border-border"],
  [/text-\[#142033\]/g, "text-foreground"],
  [/text-\[#5E6D7E\]/g, "text-muted-foreground"],
  [/text-\[#5e6d7e\]/g, "text-muted-foreground"],
  [/hover:text-\[#142033\]/g, "hover:text-foreground"],
  [/text-\[#C4A15A\]/g, "text-brass"],
  [/shadow-\[0_10px_28px_-22px_rgba\(20,32,51,0\.28\)\]/g, "shadow-[var(--shadow-panel)]"],
  [/(?<![\w-])bg-white\/95(?![\w-])/g, "bg-card/95"],
  [/(?<![\w-])bg-white\/90(?![\w-])/g, "bg-card/90"],
  [/(?<![\w-])bg-white(?![\w-])/g, "bg-card"],
]

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.(tsx|ts)$/.test(name)) out.push(full)
  }
  return out
}

let changed = 0
for (const root of roots) {
  for (const file of walk(root)) {
    if (skip(file)) continue
    let text = fs.readFileSync(file, "utf8")
    const before = text
    for (const [re, rep] of pairs) text = text.replace(re, rep)
    if (text !== before) {
      fs.writeFileSync(file, text)
      changed += 1
      console.log("updated", file.replaceAll("\\", "/"))
    }
  }
}
console.log("files", changed)
