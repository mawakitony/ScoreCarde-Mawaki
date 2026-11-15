"use client"

import { useEffect, useId, useRef } from "react"
import Script from "next/script"

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void },
      ) => string
      remove: (id: string) => void
    }
  }
}

export function TurnstileField({ siteKey }: { siteKey: string }) {
  const hostId = useId().replace(/:/g, "")
  const widgetId = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const host = document.getElementById(`cf-host-${hostId}`)
    if (!host || !window.turnstile) return
    widgetId.current = window.turnstile.render(host, {
      sitekey: siteKey,
      callback: (token) => {
        if (inputRef.current) inputRef.current.value = token
      },
      "expired-callback": () => {
        if (inputRef.current) inputRef.current.value = ""
      },
    })
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
    }
  }, [hostId, siteKey])

  return (
    <div className="space-y-2">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div id={`cf-host-${hostId}`} />
      <input ref={inputRef} type="hidden" name="turnstileToken" defaultValue="" />
    </div>
  )
}
