import { readFileSync, writeFileSync } from "node:fs"

const text = readFileSync(".env.local", "utf8")
for (const line of text.split(/\r?\n/)) {
  const i = line.indexOf("=")
  if (i <= 0 || line.startsWith("#")) continue
  const k = line.slice(0, i)
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
}

const key = process.env.AI_API_KEY
const url = `${process.env.AI_BASE_URL.replace(/\/+$/, "")}/chat/completions`

const r = await fetch(url, {
  method: "POST",
  headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
  body: JSON.stringify({
    model: process.env.AI_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Réponds uniquement en JSON. Inclure OBLIGATOIREMENT tools:[{tool,arguments,summary}].",
      },
      {
        role: "user",
        content:
          'Return JSON with keys intent,mode,message,tools,requiresConfirmation. tools[0].tool must be "create_scorecard_draft" with full arguments for E2E-AI-MATURITE-PROJET (10 questions, 3 categories, 3 ranges).',
      },
    ],
  }),
})
const body = await r.json()
const content = body.choices?.[0]?.message?.content || ""
const parsed = JSON.parse(content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1))
const summary = {
  keys: Object.keys(parsed),
  hasTools: Array.isArray(parsed.tools),
  toolsLen: parsed.tools?.length,
  hasToolCalls: Array.isArray(parsed.tool_calls),
  hasAction: Boolean(parsed.action || parsed.function || parsed.tool),
}
writeFileSync("test-results/ai-raw-keys.json", JSON.stringify({ summary, sample: parsed }, null, 2))
console.log(JSON.stringify(summary, null, 2))
