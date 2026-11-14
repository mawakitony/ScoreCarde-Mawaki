import assert from "node:assert/strict"
import test from "node:test"
import {
  ALLOWED_SUPABASE_HOST,
  ALLOWED_SUPABASE_REF,
  ALLOWED_SUPABASE_URL,
  assertAllowedSupabaseEnv,
  assertAllowedSupabaseUrl,
  isAllowedSupabaseUrl,
  isDisallowedSupabaseError,
  supabaseRefFromUrl,
} from "@/lib/env/allowed-supabase"

test("ALLOWED_SUPABASE_REF is the single staging whitelist", () => {
  assert.equal(ALLOWED_SUPABASE_REF, "hznmtadobqfhumezdgbh")
  assert.equal(ALLOWED_SUPABASE_HOST, "hznmtadobqfhumezdgbh.supabase.co")
  assert.equal(ALLOWED_SUPABASE_URL, "https://hznmtadobqfhumezdgbh.supabase.co")
})

test("hzn URL is allowed; zky / empty / other refs fail", () => {
  assert.equal(isAllowedSupabaseUrl(ALLOWED_SUPABASE_URL), true)
  assert.equal(supabaseRefFromUrl(ALLOWED_SUPABASE_URL), ALLOWED_SUPABASE_REF)
  assert.equal(assertAllowedSupabaseUrl(ALLOWED_SUPABASE_URL), ALLOWED_SUPABASE_REF)

  assert.equal(isAllowedSupabaseUrl("https://zkyjaslogpdujyeysjzw.supabase.co"), false)
  assert.throws(() => assertAllowedSupabaseUrl("https://zkyjaslogpdujyeysjzw.supabase.co"), (error: unknown) => {
    return isDisallowedSupabaseError(error) && error.message.includes("zkyjaslogpdujyeysjzw")
  })

  assert.equal(isAllowedSupabaseUrl(""), false)
  assert.throws(() => assertAllowedSupabaseUrl(""), (error: unknown) => isDisallowedSupabaseError(error))
  assert.throws(() => assertAllowedSupabaseUrl(undefined), (error: unknown) => isDisallowedSupabaseError(error))
  assert.throws(
    () =>
      assertAllowedSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "",
        SUPABASE_URL: ALLOWED_SUPABASE_URL,
      }),
    (error: unknown) => isDisallowedSupabaseError(error),
  )

  assert.equal(isAllowedSupabaseUrl("https://abcdefghijklmnop.supabase.co"), false)
  assert.throws(() => assertAllowedSupabaseUrl("https://abcdefghijklmnop.supabase.co"), (error: unknown) => {
    return isDisallowedSupabaseError(error) && error.message.includes("abcdefghijklmnop")
  })
})

test("assertAllowedSupabaseEnv rejects a foreign E2E_PROTECT URL", () => {
  assert.doesNotThrow(() =>
    assertAllowedSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: ALLOWED_SUPABASE_URL,
      E2E_SUPABASE_URL: ALLOWED_SUPABASE_URL,
      E2E_PROTECT_SUPABASE_URL: ALLOWED_SUPABASE_URL,
    }),
  )
  assert.throws(
    () =>
      assertAllowedSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: ALLOWED_SUPABASE_URL,
        E2E_PROTECT_SUPABASE_URL: "https://zkyjaslogpdujyeysjzw.supabase.co",
      }),
    (error: unknown) => isDisallowedSupabaseError(error) && String(error).includes("E2E_PROTECT_SUPABASE_URL"),
  )
})
