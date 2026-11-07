import { expect, test } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const HOST = "/e2e/assistant-robot-qa.html"
const OUT = path.resolve("tmp/lot18a-shots")
const STATES = ["idle", "listening", "thinking", "responding", "success", "error"] as const

test.describe("LOT 18A assistant robot visual QA (no auth, no AI calls)", () => {
  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true })
  })

  test("six animated states render and are not static icons only", async ({ page }) => {
    await page.goto(HOST, { waitUntil: "networkidle" })
    await expect(page.getByRole("heading", { name: /LOT 18A/i })).toBeVisible()

    for (const state of STATES) {
      const robot = page.locator(`[data-testid="ai-robot"][data-state="${state}"]`)
      await expect(robot).toBeVisible()
      await expect(robot.locator("svg")).toHaveClass(new RegExp(`ai-robot--${state}`))
    }

    // Motion classes present (CSS animations — not a frozen lucide icon)
    await expect(page.locator(".ai-robot--idle")).toHaveCount(1)
    await expect(page.locator(".ai-robot--thinking .ai-robot-particles")).toHaveCount(1)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({ path: path.join(OUT, "robot-states-light-1440.png"), fullPage: true })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.join(OUT, "robot-states-light-390.png"), fullPage: true })
  })

  test("dark palette tokens apply without auth", async ({ page }) => {
    await page.goto(`${HOST}?dark=1`, { waitUntil: "networkidle" })
    await expect(page.locator("body.dark")).toHaveCount(1)
    await page.setViewportSize({ width: 1024, height: 800 })
    await page.screenshot({ path: path.join(OUT, "robot-states-dark-1024.png"), fullPage: true })
  })

  test("reduced-motion disables looping animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(HOST, { waitUntil: "networkidle" })
    const idle = page.locator(".ai-robot--idle")
    await expect(idle).toBeVisible()
    // Computed animation-name should collapse under the media query
    const anim = await idle.evaluate((el) => getComputedStyle(el).animationName)
    expect(anim === "none" || anim === "").toBeTruthy()
  })
})
