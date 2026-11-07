function normalizeToolItem(item: unknown) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return item
  const tool = item as Record<string, unknown>
  const name = typeof tool.tool === "string" ? tool.tool : typeof tool.name === "string" ? tool.name : undefined
  const args =
    tool.arguments && typeof tool.arguments === "object" && !Array.isArray(tool.arguments)
      ? tool.arguments
      : tool.parameters && typeof tool.parameters === "object" && !Array.isArray(tool.parameters)
        ? tool.parameters
        : {}
  const summary =
    typeof tool.summary === "string" && tool.summary.trim()
      ? tool.summary
      : name
        ? `Action ${name}`
        : "Action proposée"
  return { tool: name, arguments: args, summary }
}

/** Normalize OpenAI-style {name,parameters} tool calls to the V1 {tool,arguments,summary} contract. */
export function normalizeAssistantLlmPayload(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  let tools = record.tools
  if (!Array.isArray(tools) && Array.isArray(record.tool_calls)) tools = record.tool_calls
  if (!Array.isArray(tools) && record.tool && typeof record.tool === "string") {
    tools = [{ tool: record.tool, arguments: record.arguments ?? record.parameters ?? {}, summary: record.summary }]
  }
  // Recover bare create_scorecard_draft payloads occasionally emitted at the root.
  if (!Array.isArray(tools) && (Array.isArray(record.questions) || typeof record.name === "string") && record.intent) {
    tools = [{
      tool: "create_scorecard_draft",
      arguments: {
        name: record.name,
        description: record.description,
        questionCategories: record.questionCategories,
        scoringCategories: record.scoringCategories,
        questions: record.questions,
        resultRanges: record.resultRanges,
      },
      summary: "Créer le brouillon",
    }]
  }
  if (!Array.isArray(tools)) return value
  return {
    ...record,
    tools: tools.map((item) => normalizeToolItem(item)),
  }
}
