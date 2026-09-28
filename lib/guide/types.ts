export const GUIDE_ROUTES = [
  "/dashboard",
  "/dashboard/scorecards",
  "/dashboard/templates",
  "/dashboard/leads",
  "/dashboard/leads?view=trash",
  "/dashboard/analytics",
  "/dashboard/settings",
  "/dashboard/settings/profile",
  "/dashboard/settings/organization",
  "/dashboard/settings/team",
  "/dashboard/settings/billing",
  "/dashboard/settings/domains",
  "/dashboard/settings/integrations",
  "/dashboard/settings/reports",
  "/dashboard/settings/ai",
  "/dashboard/settings/activity",
  "/dashboard/guide",
] as const

export type GuideRoute = (typeof GUIDE_ROUTES)[number]

export type CalloutKind = "tip" | "important" | "warning" | "example"

export type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; kind: CalloutKind; text: string }
  | { type: "roles"; roles: string[] }
  | { type: "config"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "compare"; leftTitle: string; left: string; rightTitle: string; right: string }
  | { type: "links"; items: { href: GuideRoute; label: string }[] }
  | { type: "questions"; items: { name: string; use: string; example: string; scored: string }[] }

export type Section = {
  id: string
  title: string
  keywords: string[]
  blocks: Block[]
}

export type Chapter = {
  id: string
  title: string
  description: string
  emoji: string
  keywords: string[]
  numbered?: boolean
  sections: Section[]
}

export function blockText(block: Block): string {
  if (block.type === "p" || block.type === "callout" || block.type === "config") return block.text
  if (block.type === "list") return block.items.join(" ")
  if (block.type === "roles") return block.roles.join(" ")
  if (block.type === "table") return [...block.headers, ...block.rows.flat()].join(" ")
  if (block.type === "compare") return `${block.leftTitle} ${block.left} ${block.rightTitle} ${block.right}`
  if (block.type === "links") return block.items.map((item) => `${item.label} ${item.href}`).join(" ")
  return block.items.map((item) => `${item.name} ${item.use} ${item.example} ${item.scored}`).join(" ")
}
