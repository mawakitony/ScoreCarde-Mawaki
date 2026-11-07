import { AGENT_LIMITS } from "@/lib/ai/agent/limits"
import { REPORT_AI_PROMPT_VERSION } from "@/lib/reports/version"
import { AI_GUARDRAILS, aiPayload, sanitizeAiAnalysis, type AIReportAnalysis, type AIReportInput } from "@/lib/ai/prompts"

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

export interface AIProvider {
  id: string
  configured: boolean
  generateReportAnalysis(input: AIReportInput): Promise<AIReportAnalysis | null>
  generateChatJson(messages: ChatMessage[], timeoutMs?: number): Promise<string | null>
}

function chatCompletionsUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "")
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postChat(input: {
  key: string
  url: string
  messages: ChatMessage[]
  timeoutMs: number
}) {
  // Groq rejects response_format=json_object unless some message contains "json".
  const hasJsonKeyword = input.messages.some((message) => /\bjson\b/i.test(message.content))
  const messages = hasJsonKeyword
    ? input.messages
    : [...input.messages, { role: "system" as const, content: "Respond with a valid JSON object only." }]
  const attempts = 3
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(chatCompletionsUrl(input.url), {
        method: "POST",
        redirect: "manual",
        signal: AbortSignal.timeout(input.timeoutMs),
        headers: {
          authorization: `Bearer ${input.key}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "default",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages,
        }),
      })
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500
        if (retryable && attempt < attempts) {
          const retryAfter = Number(response.headers.get("retry-after"))
          const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(70_000, Math.ceil(retryAfter * 1000) + 500)
            : Math.min(12_000, 800 * 2 ** (attempt - 1))
          await sleep(waitMs)
          continue
        }
        return null
      }
      const body = await response.json() as { choices?: { message?: { content?: string; reasoning?: string } }[] }
      const message = body.choices?.[0]?.message
      const content = message?.content
      if (content && content.trim()) return content
      // Some reasoning models may place the JSON payload in reasoning when content is empty.
      const reasoning = message?.reasoning
      if (reasoning && reasoning.trim()) return reasoning
      if (attempt < attempts) {
        await sleep(Math.min(8_000, 500 * 2 ** (attempt - 1)))
        continue
      }
      return null
    } catch {
      if (attempt < attempts) {
        await sleep(Math.min(8_000, 500 * 2 ** (attempt - 1)))
        continue
      }
      return null
    }
  }
  return null
}

export function activeAiProvider(): AIProvider {
  const key = process.env.AI_API_KEY
  const id = process.env.AI_PROVIDER
  const url = process.env.AI_BASE_URL
  const configured = Boolean(key && id && url)
  return {
    id: id || "unconfigured",
    configured,
    async generateReportAnalysis(input) {
      if (!configured || !key || !url) return null
      try {
        const content = await postChat({
          key,
          url,
          timeoutMs: 20_000,
          messages: [
            { role: "system", content: `${AI_GUARDRAILS} Prompt ${REPORT_AI_PROMPT_VERSION}. Réponds uniquement en JSON.` },
            { role: "user", content: JSON.stringify(aiPayload(input)) },
          ],
        })
        if (!content) return null
        return sanitizeAiAnalysis(JSON.parse(content))
      } catch {
        return null
      }
    },
    async generateChatJson(messages, timeoutMs = AGENT_LIMITS.providerTimeoutMs) {
      if (!configured || !key || !url) return null
      try {
        return await postChat({ key, url, messages, timeoutMs })
      } catch {
        return null
      }
    },
  }
}
