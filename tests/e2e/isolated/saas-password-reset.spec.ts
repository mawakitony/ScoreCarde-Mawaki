import { randomBytes } from "node:crypto"
import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason, getAppUrl } from "../../../lib/env"
import { e2eAdminClient } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"
const prefix = process.env.E2E_PREFIX?.trim() || "E2E-WOLOYEM-0"

test.describe("SaaS password reset (staging hzn)", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(180_000)

  const suffix = randomBytes(3).toString("hex")
  const email = `${prefix.toLowerCase()}.reset.${suffix}@inbox.testmail.app`
  const oldPassword = `Old-${suffix}-Aa1!`
  const newPassword = `New-${suffix}-Bb2!`
  let userId: string | null = null

  test.afterAll(async () => {
    if (!ready || !userId) return
    const admin = e2eAdminClient()
    await admin.auth.admin.deleteUser(userId)
  })

  test("01 generate recovery link, set password, login with new password", async ({ page }) => {
    const admin = e2eAdminClient()
    const created = await admin.auth.admin.createUser({
      email,
      password: oldPassword,
      email_confirm: true,
      user_metadata: { full_name: `Reset ${suffix}`, e2e_prefix: prefix },
    })
    expect(created.error, created.error?.message).toBeFalsy()
    userId = created.data.user?.id ?? null
    expect(userId).toBeTruthy()

    const appUrl = getAppUrl()
    const link = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${appUrl}/auth/confirm?next=${encodeURIComponent("/reset-password")}` },
    })
    expect(link.error, link.error?.message).toBeFalsy()
    const tokenHash = link.data.properties?.hashed_token
    expect(tokenHash).toBeTruthy()

    await page.goto(`/auth/confirm?token_hash=${encodeURIComponent(tokenHash!)}&type=recovery&next=${encodeURIComponent("/reset-password")}`)
    await page.waitForURL(/\/reset-password/, { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: /Nouveau mot de passe/i })).toBeVisible()

    await page.locator("#password").fill(newPassword)
    await page.locator("#confirmPassword").fill(newPassword)
    await page.getByRole("button", { name: /Enregistrer le mot de passe/i }).click()
    await page.waitForURL(/\/login\?message=password_updated/, { timeout: 30_000 })
    await expect(page.getByText(/Mot de passe modifié, connectez-vous/i)).toBeVisible()

    await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email)
    await page.locator("#password").fill(newPassword)
    await page.getByRole("button", { name: "Se connecter" }).click()
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 })
  })

  test("02 invalid recovery link shows clear error + resend CTA", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=invalid-token-hash&type=recovery&next=/reset-password")
    await page.waitForURL(/\/forgot-password\?error=expired/, { timeout: 30_000 })
    await expect(page.getByText(/n'est plus valable|Demandez-en un nouveau/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /Envoyer le lien/i })).toBeVisible()
  })

  test("03 login shows Mot de passe oublié link on password tab", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("link", { name: /Mot de passe oublié/i })).toBeVisible()
    await page.getByRole("link", { name: /Mot de passe oublié/i }).click()
    await page.waitForURL(/\/forgot-password/)
    await expect(page.getByRole("heading", { name: /Mot de passe oublié/i })).toBeVisible()
  })
})
