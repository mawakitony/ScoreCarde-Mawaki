import type { NextConfig } from "next";
import { contentSecurityPolicy, themePreviewContentSecurityPolicy } from "./lib/security/limits";

function withDevScriptEval(value: string) {
  if (process.env.NODE_ENV === "production") return value
  return value.replace("script-src 'self' 'unsafe-inline'", "script-src 'self' 'unsafe-inline' 'unsafe-eval'")
}

const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs"],
  logging: {
    incomingRequests: {
      ignore: [/\/invite\//, /%2Finvite%2F/i],
    },
  },
  async headers() {
    const globalHeaders = [
      ...baseSecurityHeaders,
      { key: "Content-Security-Policy", value: withDevScriptEval(contentSecurityPolicy()) },
      { key: "X-Frame-Options", value: "DENY" },
    ]
    // Catalog demos only — same-origin embed for /dashboard/templates iframes.
    const themePreviewHeaders = [
      ...baseSecurityHeaders,
      { key: "Content-Security-Policy", value: withDevScriptEval(themePreviewContentSecurityPolicy()) },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ]
    if (process.env.NODE_ENV === "production") {
      const hsts = { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }
      globalHeaders.push(hsts)
      themePreviewHeaders.push(hsts)
    }
    // Exclude theme-preview from the catch-all so we emit exactly one CSP
    // (duplicate CSP headers intersect; frame-ancestors 'none' would still block embeds).
    return [
      { source: "/theme-preview/:path*", headers: themePreviewHeaders },
      { source: "/((?!theme-preview).*)", headers: globalHeaders },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
