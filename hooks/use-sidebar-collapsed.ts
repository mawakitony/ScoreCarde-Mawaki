"use client"

import { useCallback, useSyncExternalStore } from "react"
import {
  SIDEBAR_STORAGE_KEY,
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "@/lib/dashboard/sidebar"

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  const onStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_STORAGE_KEY || event.key === null) onStoreChange()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener("storage", onStorage)
  }
}

function getSnapshot() {
  try {
    return readSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY))
  } catch {
    return false
  }
}

function getServerSnapshot() {
  return false
}

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    try {
      const next = !readSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY))
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, writeSidebarCollapsed(next))
      emit()
    } catch {
      /* private mode */
    }
  }, [])

  return { collapsed, toggle }
}
