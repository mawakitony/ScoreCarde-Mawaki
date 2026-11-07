import { readFileSync } from "node:fs"

/** Load `.env.e2e.local` then `.env.local` without overriding explicit shell vars. Never logs values. */
export function loadE2eEnvFiles() {
  for (const file of [".env.e2e.local", ".env.local"]) {
    try {
      const text = readFileSync(file, "utf8")
      for (const line of text.split(/\r?\n/)) {
        const index = line.indexOf("=")
        if (index <= 0 || line.startsWith("#")) continue
        const key = line.slice(0, index).trim()
        if (!key || process.env[key]) continue
        process.env[key] = line.slice(index + 1).trim()
      }
    } catch {
      // Optional files.
    }
  }
}
