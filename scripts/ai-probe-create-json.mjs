import { readFileSync } from "node:fs"

const text = readFileSync(".env.local", "utf8")
for (const line of text.split(/\r?\n/)) {
  const i = line.indexOf("=")
  if (i <= 0 || line.startsWith("#")) continue
  const k = line.slice(0, i)
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
}

const key = process.env.AI_API_KEY
const url = `${process.env.AI_BASE_URL.replace(/\/+$/, "")}/chat/completions`
const model = process.env.AI_MODEL

const messages = [
  {
    role: "system",
    content:
      "Tu es l'Assistant IA de WOLOYEM Score. Réponds uniquement en JSON valide selon le schéma demandé. Tu ne peux utiliser que create_scorecard_draft.",
  },
  {
    role: "user",
    content: JSON.stringify({
      mode: "prepare",
      message:
        "Crée une scorecard E2E-AI-MATURITE-PROJET avec 10 questions, 3 catégories et 3 niveaux de résultat.",
      schema: {
        intent: "string",
        mode: "advise|prepare|execute",
        message: "string",
        tools: [{ tool: "name", arguments: {}, summary: "string" }],
        requiresConfirmation: "boolean",
        diffs: [{ label: "string", before: "string", after: "string" }],
        preview: { title: "string", subtitle: "string", bullets: ["string"] },
      },
    }),
  },
]

const response = await fetch(url, {
  method: "POST",
  headers: {
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({ model, temperature: 0.2, messages }),
})

console.log("http", response.status)
const body = await response.json()
const choice = body.choices?.[0]
const content = choice?.message?.content
const keys = Object.keys(choice?.message || {})
console.log("message_keys", keys.join(","))
console.log("content_type", typeof content)
console.log("content_null", content == null)
console.log("content_len", content ? content.length : 0)
console.log("content_start", content ? content.slice(0, 200).replace(/\n/g, "\\n") : "")
console.log("content_has_json", content ? content.includes("{") : false)
console.log("finish_reason", choice?.finish_reason)
console.log("has_reasoning", Boolean(choice?.message?.reasoning || body.choices?.[0]?.message?.reasoning_content))
// Never print API key; print only whether refusal/tool fields exist
console.log("refusal", choice?.message?.refusal ? "present" : "absent")
try {
  const start = content.indexOf("{")
  const end = content.lastIndexOf("}")
  const sliced = start >= 0 ? content.slice(start, end + 1) : content
  JSON.parse(sliced)
  console.log("parse", "ok")
} catch {
  console.log("parse", "fail")
}
