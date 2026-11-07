"use server"

import { writeActivity } from "@/lib/audit/write"
import { runAssistantTurn } from "@/lib/ai/agent/runtime"
import {
  assistantModeSchema,
  executionPlanSchema,
  pageContextSchema,
  type AssistantMode,
  type ExecutionPlan,
  type PageContext,
} from "@/lib/ai/agent/schemas"
import { runTool } from "@/lib/ai/tools/execute"
import { getUser } from "@/lib/auth/session"
import { ensureMembership } from "@/lib/data/membership"
import { activeAiProvider } from "@/lib/ai/provider"
import { z } from "zod"

const historySchema = z.array(z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2_000),
})).max(12)

export async function getAssistantStatus() {
  const membership = await ensureMembership()
  if (!membership) return { ok: false as const, error: "Session requise." }
  return {
    ok: true as const,
    configured: activeAiProvider().configured,
    role: membership.role,
  }
}

export async function chatWithAssistant(input: {
  message: string
  mode: AssistantMode
  pageContext?: PageContext
  history?: { role: "user" | "assistant"; content: string }[]
}) {
  const membership = await ensureMembership()
  const user = await getUser()
  if (!membership || !user) return { ok: false as const, error: "Session requise." }
  const mode = assistantModeSchema.safeParse(input.mode)
  if (!mode.success) return { ok: false as const, error: "Mode invalide." }
  const message = String(input.message ?? "").trim()
  if (message.length < 2) return { ok: false as const, error: "Message trop court." }
  const pageContext = input.pageContext ? pageContextSchema.safeParse(input.pageContext) : null
  if (pageContext && !pageContext.success) return { ok: false as const, error: "Contexte invalide." }
  const history = historySchema.safeParse(input.history ?? [])
  if (!history.success) return { ok: false as const, error: "Historique invalide." }

  const turn = await runAssistantTurn({
    message,
    mode: mode.data,
    role: membership.role,
    organizationId: membership.organization.id,
    pageContext: pageContext?.success ? pageContext.data : undefined,
    history: history.data,
  })

  return {
    ok: true as const,
    ...turn,
  }
}

export async function applyAssistantPlan(planInput: ExecutionPlan) {
  const membership = await ensureMembership()
  const user = await getUser()
  if (!membership || !user) return { ok: false as const, error: "Session requise." }
  const plan = executionPlanSchema.safeParse(planInput)
  if (!plan.success) return { ok: false as const, error: "Plan invalide." }
  if (plan.data.mode === "advise") return { ok: false as const, error: "Le mode Conseiller n'applique aucune modification." }

  const results = []
  for (const step of plan.data.steps) {
    const ran = await runTool({
      tool: step.tool,
      args: step.arguments,
      role: membership.role,
      organizationId: membership.organization.id,
      allowWrites: true,
    })
    if (!ran.ok) {
      return {
        ok: false as const,
        error: ran.error,
        completed: results,
      }
    }
    results.push({ tool: step.tool, summary: step.summary, result: ran.result })
    if (ran.writes) {
      await writeActivity({
        organizationId: membership.organization.id,
        actorId: user.id,
        action: "ai.action_executed",
        metadata: {
          tool: step.tool,
          resource_type: ran.resourceType ?? "resource",
          resource_id: ran.resourceId ?? "00000000-0000-4000-8000-000000000000",
          affected_count: String(ran.affected ?? 1),
        },
      })
    }
  }

  return {
    ok: true as const,
    message: "Les actions ont été appliquées.",
    results,
  }
}
