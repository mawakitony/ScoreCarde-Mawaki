export const SIDEBAR_STORAGE_KEY = "woloyem.sidebar.collapsed"

/** Parse persisted sidebar state. Unknown values default to expanded. */
export function readSidebarCollapsed(raw: string | null | undefined): boolean {
  return raw === "1" || raw === "true"
}

export function writeSidebarCollapsed(collapsed: boolean): string {
  return collapsed ? "1" : "0"
}

export const SIDEBAR_WIDTH_EXPANDED = 240
export const SIDEBAR_WIDTH_COLLAPSED = 76
