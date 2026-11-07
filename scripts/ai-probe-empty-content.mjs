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

for (let i = 0; i < 5; i += 1) {
  const response = await fetch(url, {
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
            'Crée un JSON assistant avec tools[0]=create_scorecard_draft contenant name E2E-AI-MATURITE-PROJET, 10 questions single_choice avec 2 options score, 3 questionCategories, 3 scoringCategories (weight requis), 3 resultRanges. Schéma: intent,mode,message,tools,requiresConfirmation,diffs,preview',
        },
      ],
    }),
  })
  const body = await response.json()
  const msg = body.choices?.[0]?.message || {}
  const content = msg.content
  let parse = "n/a"
  if (content) {
    try {
      JSON.parse(content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1))
      parse = "ok"
    } catch {
      parse = "fail"
    }
  } else parse = "empty"
  let argsInfo = ""
  if (parse === "ok") {
    const parsed = JSON.parse(content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1))
    const args = parsed.tools?.[0]?.arguments || {}
    argsInfo = `q=${args.questions?.length||0},qc=${args.questionCategories?.length||0},sc=${args.scoringCategories?.length||0},rr=${args.resultRanges?.length||0}`
  }
  console.log(`run${i}`, "http", response.status, "content_len", content ? content.length : 0, "reasoning_len", msg.reasoning ? String(msg.reasoning).length : 0, "parse", parse, argsInfo)
}
