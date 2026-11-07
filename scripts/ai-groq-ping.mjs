import { readFileSync } from "fs"

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (!m) continue
  process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "")
}

const base = (process.env.AI_BASE_URL || "").replace(/\/+$/, "")
const url = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`
const response = await fetch(url, {
  method: "POST",
  headers: {
    authorization: `Bearer ${process.env.AI_API_KEY}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: process.env.AI_MODEL || "openai/gpt-oss-120b",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Reply with JSON only." },
      { role: "user", content: '{"ok":true,"ping":1}' },
    ],
  }),
})
console.log("status", response.status)
console.log("retry-after", response.headers.get("retry-after"))
console.log((await response.text()).slice(0, 600))
if (!response.ok) process.exit(1)
