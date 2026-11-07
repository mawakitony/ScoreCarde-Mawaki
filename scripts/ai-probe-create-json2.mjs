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
const url = `${process.env.AI_BASE_URL.replace(/\/+$/, "")}/chat/completions`
const model = process.env.AI_MODEL

const SYSTEM = `Tu es l'Assistant IA de WOLOYEM Score.
Réponds uniquement en JSON valide selon le schéma demandé.
Tu ne peux utiliser que ces tools: create_scorecard_draft.
Tu ne peux jamais publier, supprimer, anonymiser, gérer la facturation, les domaines, les membres, les secrets ou la plateforme.
Mode prepare: tu peux proposer des tools d'écriture dans tools[], requiresConfirmation=true, sans prétendre qu'ils sont déjà appliqués.
Pour create_scorecard_draft, status implicite = draft uniquement.
Maximum 5 tools, maximum 50 questions.`

async function once() {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            mode: "prepare",
            role: "owner",
            pageContext: null,
            message:
              "Crée une scorecard E2E de maturité projet nommée exactement E2E-AI-MATURITE-PROJET avec 10 questions, 3 catégories et 3 niveaux de résultat. Ne publie pas.",
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
      ],
    }),
  })
  const body = await response.json()
  const msg = body.choices?.[0]?.message || {}
  const content = msg.content
  console.log("content_len", content ? content.length : 0)
  console.log("reasoning_len", msg.reasoning ? String(msg.reasoning).length : 0)
  console.log("finish", body.choices?.[0]?.finish_reason)
  if (!content) {
    console.log("EMPTY_CONTENT")
    return
  }
  let parsed
  try {
    const start = content.indexOf("{")
    const end = content.lastIndexOf("}")
    parsed = JSON.parse(start >= 0 ? content.slice(start, end + 1) : content)
    console.log("json_parse ok")
  } catch (e) {
    console.log("json_parse fail", String(e.message).slice(0, 80))
    console.log("tail", content.slice(-120).replace(/\n/g, "\\n"))
    return
  }
  console.log("tools", parsed.tools?.length, "tool0", parsed.tools?.[0]?.tool)
  const args = parsed.tools?.[0]?.arguments || {}
  console.log("q", args.questions?.length, "cats", args.questionCategories?.length, "ranges", args.resultRanges?.length)
  // lightweight schema like runtime top-level
  const top = z.object({
    intent: z.string(),
    mode: z.enum(["advise", "prepare", "execute"]),
    message: z.string(),
    tools: z.array(z.object({
      tool: z.string(),
      arguments: z.record(z.string(), z.unknown()).default({}),
      summary: z.string(),
    })).max(5),
    requiresConfirmation: z.boolean().optional(),
  }).safeParse(parsed)
  console.log("top_schema", top.success ? "ok" : top.error.issues.slice(0, 3))
}

await once()
await once()
