import assert from "node:assert/strict"
import test from "node:test"
import { resolveApprovedHostAvatar, resolveAuthorizedAvatar } from "./authorized.ts"
import { clearAvatarCache, getCachedAvatar, setCachedAvatar } from "./cache.ts"
import { getAvatarFallback } from "./fallback.ts"
import { resolveGoogleAvatar } from "./google.ts"
import { resolveMicrosoftAvatar } from "./microsoft.ts"
import { resolveLeadAvatar } from "./resolve.ts"
import { AvatarResolveStatus } from "./types.ts"
import { isSafeAvatarUrl } from "./url.ts"

test.beforeEach(() => {
  clearAvatarCache()
})

test("Google: photo available from contacts search", async () => {
  const result = await resolveGoogleAvatar("ada@example.com", {
    accessToken: "tok",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          results: [
            {
              person: {
                emailAddresses: [{ value: "ada@example.com" }],
                photos: [{ url: "https://lh3.googleusercontent.com/a/photo" }],
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  })
  assert.equal(result.status, AvatarResolveStatus.AVAILABLE)
  assert.equal(result.source, "google")
  assert.ok(result.url?.startsWith("https://"))
})

test("Google: access denied returns NOT_AUTHORIZED", async () => {
  const result = await resolveGoogleAvatar("ada@example.com", {
    accessToken: "tok",
    fetchFn: async () => new Response("", { status: 403 }),
  })
  assert.equal(result.status, AvatarResolveStatus.NOT_AUTHORIZED)
})

test("Google: not configured", async () => {
  const result = await resolveGoogleAvatar("ada@example.com", {
    env: {},
    accessToken: null,
  })
  assert.equal(result.status, AvatarResolveStatus.NOT_CONFIGURED)
})

test("Microsoft: photo available for tenant user", async () => {
  const result = await resolveMicrosoftAvatar("user@contoso.com", {
    accessToken: "tok",
    sameTenant: true,
    fetchFn: async () =>
      new Response(null, {
        status: 200,
        headers: {
          "content-type": "image/jpeg",
          "x-avatar-public-url": "https://cdn.contoso.com/avatars/user.jpg",
        },
      }),
  })
  assert.equal(result.status, AvatarResolveStatus.AVAILABLE)
  assert.equal(result.source, "microsoft")
})

test("Microsoft: external user inaccessible", async () => {
  const result = await resolveMicrosoftAvatar("someone@outlook.com", {
    accessToken: "tok",
    sameTenant: false,
  })
  assert.equal(result.status, AvatarResolveStatus.NOT_AUTHORIZED)
  assert.equal(result.reason, "external_user_inaccessible")
})

test("Microsoft: not configured", async () => {
  const result = await resolveMicrosoftAvatar("user@contoso.com", { env: {}, accessToken: null })
  assert.equal(result.status, AvatarResolveStatus.NOT_CONFIGURED)
})

test("provider not configured does not invent photos", async () => {
  const result = await resolveLeadAvatar(
    { organizationId: "org-a", leadId: "lead-1", email: "a@b.co" },
    { forceSync: true, env: {}, google: { env: {} }, microsoft: { env: {} } },
  )
  assert.equal(result.status, AvatarResolveStatus.NOT_FOUND)
  assert.equal(result.source, "initials")
  assert.equal(result.url, null)
})

test("photo absente falls back to initials", async () => {
  const fallback = getAvatarFallback()
  assert.equal(fallback.source, "initials")
  assert.equal(fallback.url, null)
})

test("network error is ERROR and does not fake a photo", async () => {
  const result = await resolveGoogleAvatar("ada@example.com", {
    accessToken: "tok",
    fetchFn: async () => {
      throw new Error("offline")
    },
  })
  assert.equal(result.status, AvatarResolveStatus.ERROR)
  assert.equal(result.url, null)
})

test("cache valide is reused without provider calls", async () => {
  let calls = 0
  const fetchFn = async () => {
    calls += 1
    return new Response(
      JSON.stringify({
        results: [
          {
            person: {
              emailAddresses: [{ value: "cached@example.com" }],
              photos: [{ url: "https://lh3.googleusercontent.com/a/cached" }],
            },
          },
        ],
      }),
      { status: 200 },
    )
  }

  const first = await resolveLeadAvatar(
    { organizationId: "org-a", leadId: "lead-1", email: "cached@example.com" },
    {
      forceSync: true,
      now: 1_000,
      env: { LEAD_AVATAR_CACHE_TTL_MS: "3600000" },
      google: { accessToken: "tok", fetchFn },
      microsoft: { env: {} },
    },
  )
  assert.equal(first.fromCache, false)
  assert.equal(first.status, AvatarResolveStatus.AVAILABLE)

  const second = await resolveLeadAvatar(
    { organizationId: "org-a", leadId: "lead-1", email: "cached@example.com" },
    {
      forceSync: true,
      now: 2_000,
      env: { LEAD_AVATAR_CACHE_TTL_MS: "3600000" },
      google: { accessToken: "tok", fetchFn },
    },
  )
  assert.equal(second.fromCache, true)
  assert.equal(calls, 1)
})

test("cache expiré triggers a fresh resolve", async () => {
  setCachedAvatar({
    organizationId: "org-a",
    leadId: "lead-1",
    emailKey: "old@example.com",
    status: AvatarResolveStatus.AVAILABLE,
    source: "google",
    url: "https://lh3.googleusercontent.com/a/old",
    checkedAt: 0,
    expiresAt: 500,
  })
  assert.equal(getCachedAvatar("org-a", "old@example.com", 1_000), null)

  const result = await resolveLeadAvatar(
    {
      organizationId: "org-a",
      leadId: "lead-1",
      email: "old@example.com",
      storedUrl: "https://cdn.example.com/avatar.png",
    },
    { now: 1_000, forceSync: false },
  )
  assert.equal(result.fromCache, false)
  assert.equal(result.source, "stored")
  assert.equal(result.url, "https://cdn.example.com/avatar.png")
})

test("isolation entre organisations", async () => {
  setCachedAvatar({
    organizationId: "org-a",
    leadId: "lead-1",
    emailKey: "shared@example.com",
    status: AvatarResolveStatus.AVAILABLE,
    source: "stored",
    url: "https://cdn.example.com/a.png",
    checkedAt: 0,
    expiresAt: 9_999_999,
  })

  const leaked = getCachedAvatar("org-b", "shared@example.com", 1_000)
  assert.equal(leaked, null)

  const forB = await resolveLeadAvatar(
    { organizationId: "org-b", leadId: "lead-9", email: "shared@example.com" },
    { forceSync: false, now: 1_000 },
  )
  assert.equal(forB.url, null)
  assert.equal(forB.source, "initials")

  const forA = await resolveLeadAvatar(
    { organizationId: "org-a", leadId: "lead-1", email: "shared@example.com" },
    { forceSync: false, now: 1_000 },
  )
  assert.equal(forA.fromCache, true)
  assert.equal(forA.url, "https://cdn.example.com/a.png")
})

test("stored authorized URL wins over providers", async () => {
  let googleCalls = 0
  const result = await resolveLeadAvatar(
    {
      organizationId: "org-a",
      leadId: "lead-1",
      email: "ada@example.com",
      storedUrl: "https://storage.example.com/leads/ada.jpg",
    },
    {
      forceSync: true,
      google: {
        accessToken: "tok",
        fetchFn: async () => {
          googleCalls += 1
          return new Response("{}", { status: 200 })
        },
      },
    },
  )
  assert.equal(result.source, "stored")
  assert.equal(googleCalls, 0)
})

test("unsafe stored URL is rejected", () => {
  const result = resolveAuthorizedAvatar("http://127.0.0.1/secret.png")
  assert.equal(result.status, AvatarResolveStatus.ERROR)
  assert.equal(result.url, null)
})

test("approved hosts require explicit allowlist", () => {
  assert.equal(resolveApprovedHostAvatar("https://gravatar.com/x", []).status, AvatarResolveStatus.NOT_CONFIGURED)
  assert.equal(
    resolveApprovedHostAvatar("https://gravatar.com/x", ["images.approved.example"]).status,
    AvatarResolveStatus.NOT_AUTHORIZED,
  )
  assert.equal(
    resolveApprovedHostAvatar("https://images.approved.example/a.png", ["images.approved.example"]).status,
    AvatarResolveStatus.AVAILABLE,
  )
})

test("production sync stays disabled by default", async () => {
  let calls = 0
  const result = await resolveLeadAvatar(
    { organizationId: "org-a", leadId: "lead-1", email: "ada@gmail.com" },
    {
      env: { LEAD_AVATAR_SYNC_ENABLED: "0", GOOGLE_OAUTH_CLIENT_ID: "x", GOOGLE_PEOPLE_ACCESS_TOKEN: "tok" },
      google: {
        accessToken: "tok",
        fetchFn: async () => {
          calls += 1
          return new Response("{}", { status: 200 })
        },
      },
    },
  )
  assert.equal(calls, 0)
  assert.equal(result.source, "initials")
})

test("SSRF guard rejects private avatar hosts", () => {
  assert.equal(isSafeAvatarUrl("https://169.254.169.254/latest"), false)
  assert.equal(isSafeAvatarUrl("https://cdn.example.com/a.jpg"), true)
})
