import { expect, test } from "@playwright/test"

/**
 * Landing commerciale publique — ne nécessite pas de seed isolé.
 * Skip si aucun serveur local n’est joignable.
 */
test.describe("SaaS commercial landing", () => {
  test("public home exposes marketing CTA and sections @marketing", async ({ page }) => {
    const response = await page.goto("/")
    test.skip(!response || response.status() >= 500, "App server not available")

    await expect(page.getByRole("heading", { level: 1, name: /Transformez vos questionnaires/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Essayer gratuitement pendant 14 jours/i }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /Se connecter/i }).first()).toBeVisible()

    await page.getByRole("link", { name: /Découvrir la démonstration/i }).click()
    await expect(page.locator("#demonstration")).toBeVisible()

    await page.goto("/#tarifs")
    await expect(page.getByText(/10\s*USD/i).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /Commencer mes 14 jours gratuits/i }).first()).toBeVisible()

    await page.getByRole("link", { name: /Essayer gratuitement pendant 14 jours/i }).first().click()
    await expect(page).toHaveURL(/\/signup/)
  })

  test("pricing page highlights starter trial CTA @marketing", async ({ page }) => {
    const response = await page.goto("/pricing")
    test.skip(!response || response.status() >= 500, "App server not available")
    await expect(page.getByRole("heading", { name: "Tarifs" })).toBeVisible()
    await expect(page.getByText(/10 USD \/ mois \/ organisation/i).first()).toBeVisible()
    await page.getByRole("link", { name: /Commencer mes 14 jours gratuits/i }).first().click()
    await expect(page).toHaveURL(/\/signup/)
  })
})
