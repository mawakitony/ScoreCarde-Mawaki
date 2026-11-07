import type { ToolName } from "@/lib/ai/agent/schemas"
import { parseToolArgs } from "@/lib/ai/tools/plan"
import { canUseTool, toolPermissionError, toolWrites } from "@/lib/ai/tools/policy"
import { runReadTool } from "@/lib/ai/tools/reads"
import { runWriteTool } from "@/lib/ai/tools/writes"

export { buildExecutionPlan, parseToolArgs } from "@/lib/ai/tools/plan"

export async function runTool(input: {
  tool: ToolName
  args: unknown
  role: string
  organizationId: string
  allowWrites: boolean
}) {
  if (!canUseTool(input.role, input.tool)) {
    return { ok: false as const, error: toolPermissionError(input.tool) }
  }
  const parsed = parseToolArgs(input.tool, input.args)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Arguments invalides." }
  if (toolWrites(input.tool) && !input.allowWrites) {
    return { ok: false as const, error: "Confirmation requise avant toute écriture." }
  }
  if (!toolWrites(input.tool)) {
    const result = await runReadTool(input.tool, parsed.data, input.organizationId)
    if (result && typeof result === "object" && "error" in result && result.error) {
      return { ok: false as const, error: String(result.error) }
    }
    return { ok: true as const, result, writes: false as const, resourceType: undefined, resourceId: undefined, affected: undefined }
  }
  const written = await runWriteTool(input.tool, parsed.data, input.organizationId)
  if (!written.ok) return { ok: false as const, error: written.error }
  return {
    ok: true as const,
    result: written.result,
    writes: true as const,
    resourceType: written.resourceType,
    resourceId: written.resourceId,
    affected: written.affected,
  }
}
