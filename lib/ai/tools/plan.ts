import { randomUUID } from "node:crypto"
import { AGENT_LIMITS } from "@/lib/ai/agent/limits"
import {
  executionPlanSchema,
  toolArgsSchemas,
  toolNameSchema,
  type AssistantMode,
  type ExecutionPlan,
  type ToolName,
} from "@/lib/ai/agent/schemas"
import { toolWrites } from "@/lib/ai/tools/policy"

export function parseToolArgs(tool: ToolName, args: unknown) {
  return toolArgsSchemas[tool].safeParse(args ?? {})
}

export function buildExecutionPlan(input: {
  mode: AssistantMode
  summary: string
  tools: { tool: string; arguments?: Record<string, unknown>; summary: string }[]
  diffs?: ExecutionPlan["diffs"]
  preview?: ExecutionPlan["preview"]
}): { ok: true; plan: ExecutionPlan } | { ok: false; error: string } {
  if (input.tools.length === 0) return { ok: false, error: "Aucune action à appliquer." }
  if (input.tools.length > AGENT_LIMITS.maxToolsPerTurn) {
    return { ok: false, error: `Maximum ${AGENT_LIMITS.maxToolsPerTurn} outils par requête.` }
  }
  const steps = []
  for (const [index, call] of input.tools.entries()) {
    const name = toolNameSchema.safeParse(call.tool)
    if (!name.success) return { ok: false, error: `Tool inconnu: ${call.tool}` }
    const args = parseToolArgs(name.data, call.arguments)
    if (!args.success) return { ok: false, error: args.error.issues[0]?.message ?? "Arguments invalides." }
    steps.push({
      id: `step-${index + 1}`,
      tool: name.data,
      arguments: args.data as Record<string, unknown>,
      summary: call.summary,
      writes: toolWrites(name.data),
    })
  }
  const plan = executionPlanSchema.safeParse({
    id: randomUUID(),
    mode: input.mode,
    summary: input.summary,
    steps,
    diffs: input.diffs ?? [],
    preview: input.preview,
  })
  if (!plan.success) return { ok: false, error: "Plan invalide." }
  return { ok: true, plan: plan.data }
}
