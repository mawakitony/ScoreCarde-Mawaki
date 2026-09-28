import { can } from "@/lib/auth/permissions"

export const SEARCH_MIN_LENGTH = 2
export const SEARCH_LIMIT = 5
export const SEARCH_DEBOUNCE_MS = 300

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  analyst: "Analyst",
  viewer: "Viewer",
  member: "Membre",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "Publiée",
  paused: "En pause",
  archived: "Archivée",
}

export type SearchAccess = {
  scorecards: boolean
  leads: boolean
  members: boolean
  phone: boolean
  fullEmail: boolean
}

export function searchAccess(role: string): SearchAccess {
  const leads = can({ role }, "lead.read")
  return {
    scorecards: true,
    leads,
    members: can({ role }, "team.manage"),
    phone: leads,
    fullEmail: can({ role }, "lead.edit"),
  }
}

export function planSearch(query: string) {
  const term = query.trim().slice(0, 80)
  if (term.length < SEARCH_MIN_LENGTH) return null
  return { term }
}

export function displayEmail(email: string | null, full: boolean) {
  if (!email || !email.includes("@")) return null
  if (full) return email
  const [local, domain] = email.split("@")
  if (!local || !domain) return null
  return `${local.slice(0, 1)}***@${domain}`
}

export function scorecardHref(id: string) {
  return `/dashboard/scorecards/${id}`
}

export function leadHref(id: string) {
  return `/dashboard/leads/${id}`
}

export function memberHref(id: string) {
  return `/dashboard/settings/team?member=${id}`
}

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? "Brouillon"
}

export function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? "Membre"
}

export function textIncludes(value: string | null | undefined, term: string) {
  return Boolean(value && value.toLowerCase().includes(term.toLowerCase()))
}

export function scorecardMatches(card: { name: string; slug: string }, term: string) {
  return textIncludes(card.name, term) || textIncludes(card.slug, term)
}

export function leadMatches(person: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
}, term: string, phone: boolean) {
  return textIncludes(person.first_name, term)
    || textIncludes(person.last_name, term)
    || textIncludes(person.email, term)
    || textIncludes(person.company, term)
    || (phone && textIncludes(person.phone, term))
}

export function memberMatches(member: { fullName: string | null; email: string | null }, term: string) {
  return textIncludes(member.fullName, term) || textIncludes(member.email, term)
}

export function limitHits<T>(items: T[]) {
  return items.slice(0, SEARCH_LIMIT)
}

export function belongsToOrganization(organizationId: string, rowOrganizationId: string) {
  return organizationId === rowOrganizationId
}

export function isActiveLead(deletedAt: string | null) {
  return deletedAt == null
}

export type SearchKeyState = { open: boolean; index: number; count: number }

export function nextSearchKey(state: SearchKeyState, key: string) {
  if (key === "Escape") return { open: false, index: 0, count: state.count, activate: false }
  if (key === "ArrowDown" && state.count > 0) {
    const index = state.index < 0 ? 0 : Math.min(state.count - 1, state.index + 1)
    return { open: true, index, count: state.count, activate: false }
  }
  if (key === "ArrowUp" && state.count > 0) {
    const index = state.index < 0 ? 0 : Math.max(0, state.index - 1)
    return { open: true, index, count: state.count, activate: false }
  }
  if (key === "Enter" && state.open && state.count > 0 && state.index >= 0) {
    return { open: false, index: state.index, count: state.count, activate: true }
  }
  return { open: state.open, index: state.index, count: state.count, activate: false }
}
