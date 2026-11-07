import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"
import { register } from "node:module"

const text = readFileSync(".env.local", "utf8")
for (const line of text.split(/\r?\n/)) {
  const i = line.indexOf("=")
  if (i <= 0 || line.startsWith("#")) continue
  const k = line.slice(0, i)
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
}

register("./test/register.mjs", pathToFileURL("./"))
const { activeAiProvider } = await import("../lib/ai/provider.ts")
const { normalizeAssistantLlmPayload } = await import("../lib/ai/agent/normalize.ts")
const { assistantLlmResponseSchema, toolArgsSchemas } = await import("../lib/ai/agent/schemas.ts")
const { buildExecutionPlan } = await import("../lib/ai/tools/plan.ts")

const p = activeAiProvider()
const content = await p.generateChatJson(
  [
    {
      role: "system",
      content:
        "JSON only. tools[].tool/arguments/summary required. For create_scorecard_draft, arguments MUST include name and exactly 10 questions (each with title,type,options[2]), exactly 3 questionCategories, exactly 3 scoringCategories(weight), exactly 3 resultRanges(minPercent,maxPercent,label). No empty arrays.",
    },
    {
      role: "user",
      content: JSON.stringify({
        mode: "prepare",
        message:
          "Crée la scorecard E2E-AI-MATURITE-PROJET avec EXACTEMENT 10 questions, 3 questionCategories, 3 scoringCategories, 3 resultRanges. Remplis tous les tableaux.",
      }),
    },
  ],
  60_000,
)
console.log("len", content?.length || 0)
const parsed = normalizeAssistantLlmPayload(JSON.parse(content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1)))
const top = assistantLlmResponseSchema.safeParse(parsed)
console.log("top", top.success, top.success ? top.data.tools[0]?.tool : top.error.issues[0])
if (!top.success) process.exit(1)
const args = top.data.tools[0]?.arguments
const direct = toolArgsSchemas.create_scorecard_draft.safeParse(args)
if (!direct.success) {
  console.log("arg_issues")
  for (const issue of direct.error.issues.slice(0, 8)) {
    console.log("-", issue.path.join("."), issue.code, issue.message, "recv=", JSON.stringify(issue).includes("received") ? String(issue.message) : "")
  }
  // print typeof for suspicious fields
  console.log("typeof questions0", typeof args?.questions?.[0], Array.isArray(args?.questions))
  console.log("typeof qc0", typeof args?.questionCategories?.[0])
  console.log("typeof sc0", typeof args?.scoringCategories?.[0])
  console.log("typeof rr0", typeof args?.resultRanges?.[0])
  console.log("options0", args?.questions?.[0]?.options, typeof args?.questions?.[0]?.options)
} else {
  console.log("direct ok", {
    q: direct.data.questions.length,
    qc: direct.data.questionCategories.length,
    sc: direct.data.scoringCategories.length,
    rr: direct.data.resultRanges.length,
  })
}
const built = buildExecutionPlan({ mode: "prepare", summary: top.data.message, tools: top.data.tools })
console.log("plan", built.ok ? "ok" : built.error)
