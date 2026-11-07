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
      { role: "system", content: "Réponds uniquement en JSON valide." },
      {
        role: "user",
        content:
          "Crée un JSON assistant avec tools[0]=create_scorecard_draft contenant name E2E-AI-MATURITE-PROJET, 10 questions single_choice avec 2 options score, 3 questionCategories, 3 scoringCategories (weight requis), 3 resultRanges. Schéma: intent,mode,message,tools,requiresConfirmation,diffs,preview",
      },
    ],
  }),
})
const j = await r.json()
const c = j.choices[0].message.content
const parsed = JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1))
const tool0 = parsed.tools?.[0] || {}
const params = tool0.parameters || tool0.arguments || {}
const summary = {
  tool0Keys: Object.keys(tool0),
  paramKeys: Object.keys(params),
  q: params.questions?.length ?? null,
  qc: params.questionCategories?.length ?? null,
  sc: params.scoringCategories?.length ?? null,
  rr: params.resultRanges?.length ?? null,
  name: params.name ?? null,
}
writeFileSync("test-results/ai-args-shape.json", JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
