import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import { z } from "zod"

const text = readFileSync(".env.local", "utf8")
for (const line of text.split(/\r?\n/)) {
  const i = line.indexOf("=")
  if (i <= 0 || line.startsWith("#")) continue
  const k = line.slice(0, i)
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
}

const { register } = await import("node:module")
const { pathToFileURL: toUrl } = await import("node:url")
register("./test/register.mjs", toUrl("./"))

const { activeAiProvider } = await import("../lib/ai/provider.ts")
const p = activeAiProvider()
console.log("provider.id:", p.id)
console.log("provider.configured:", p.configured)

const content = await p.generateChatJson(
  [
    { role: "system", content: "Reply with JSON only. No markdown fences." },
    {
      role: "user",
      content: 'Return exactly this JSON object: {"status":"ok","message":"WOLOYEM Score AI ready"}',
    },
  ],
  30_000,
)

console.log("content_null:", content === null)
console.log("content_len:", content ? content.length : 0)
if (!content) {
  console.log("RESULT: FAIL provider_error")
  process.exit(1)
}
if (process.env.AI_API_KEY && content.includes(process.env.AI_API_KEY)) {
  console.log("RESULT: FAIL provider_error")
  process.exit(1)
}

let parsed
try {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim()
  parsed = JSON.parse(cleaned)
  console.log("json_parse: ok")
} catch {
  console.log("RESULT: FAIL invalid_json")
  process.exit(1)
}

const schema = z.object({ status: z.string(), message: z.string() })
const validated = schema.safeParse(parsed)
if (!validated.success) {
  console.log("RESULT: FAIL schema_validation_failed")
  process.exit(1)
}
console.log("status:", validated.data.status)
console.log("message:", validated.data.message)
console.log("RESULT: PASS")
