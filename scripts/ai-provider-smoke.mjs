import { readFileSync } from "node:fs"
import { z } from "zod"

const text = readFileSync(".env.local", "utf8")
for (const line of text.split(/\r?\n/)) {
  const i = line.indexOf("=")
  if (i <= 0 || line.startsWith("#")) continue
  const k = line.slice(0, i)
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
}

const key = process.env.AI_API_KEY
const provider = process.env.AI_PROVIDER
const baseUrl = process.env.AI_BASE_URL
const model = process.env.AI_MODEL

console.log("AI_API_KEY:", key ? "configured" : "missing")
console.log("AI_PROVIDER:", provider || "missing")
console.log("AI_BASE_URL:", baseUrl ? "configured" : "missing")
console.log("AI_MODEL:", model || "missing")

if (!key || !provider || !baseUrl || !model) {
  console.log("RESULT: FAIL authentication_failed")
  process.exit(1)
}

const candidates = []
const trimmed = baseUrl.replace(/\/+$/, "")
candidates.push(trimmed)
if (!trimmed.endsWith("/chat/completions")) {
  candidates.push(`${trimmed}/chat/completions`)
}

const messages = [
  { role: "system", content: "Reply with JSON only. No markdown fences." },
  {
    role: "user",
    content: 'Return exactly this JSON object: {"status":"ok","message":"WOLOYEM Score AI ready"}',
  },
]

function classifyHttp(status) {
  if (status === 401 || status === 403) return "authentication_failed"
  if (status === 404) return "model_not_available"
  if (status === 429) return "rate_limited"
  if (status >= 500) return "provider_error"
  return "provider_error"
}

async function tryUrl(url) {
  const started = Date.now()
  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model, temperature: 0.2, messages }),
    })
    const ms = Date.now() - started
    const textBody = await response.text()
    const hasSecret = Boolean(key && textBody.includes(key))
    return {
      urlKind: url.endsWith("/chat/completions") ? "with_chat_completions" : "base_only",
      status: response.status,
      ok: response.ok,
      ms,
      hasSecret,
      bodyLen: textBody.length,
      body: textBody,
    }
  } catch (error) {
    const name = error?.name || "Error"
    if (name === "TimeoutError" || name === "AbortError") {
      return { urlKind: url.endsWith("/chat/completions") ? "with_chat_completions" : "base_only", errorCode: "timeout" }
    }
    return { urlKind: url.endsWith("/chat/completions") ? "with_chat_completions" : "base_only", errorCode: "network_error" }
  }
}

const schema = z.object({ status: z.string(), message: z.string() })
let bestFail = "provider_error"

for (const url of candidates) {
  const result = await tryUrl(url)
  console.log("probe:", result.urlKind, "http:", result.status ?? "n/a", "ms:", result.ms ?? "n/a", "secret_in_body:", result.hasSecret === true)
  if (result.errorCode) {
    bestFail = result.errorCode
    continue
  }
  if (result.hasSecret) {
    console.log("RESULT: FAIL provider_error")
    process.exit(1)
  }
  if (!result.ok) {
    bestFail = classifyHttp(result.status)
    continue
  }
  let content
  try {
    const json = JSON.parse(result.body)
    content = json?.choices?.[0]?.message?.content
  } catch {
    console.log("RESULT: FAIL invalid_json")
    process.exit(1)
  }
  if (!content || typeof content !== "string") {
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
  const validated = schema.safeParse(parsed)
  if (!validated.success) {
    console.log("RESULT: FAIL schema_validation_failed")
    process.exit(1)
  }
  console.log("status:", validated.data.status)
  console.log("message:", validated.data.message)
  console.log("working_url_kind:", result.urlKind)
  console.log("RESULT: PASS")
  process.exit(0)
}

console.log("RESULT: FAIL", bestFail)
process.exit(1)
