import { randomBytes, randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import ExcelJS from "exceljs"
import { expect, test, type Browser, type Page } from "@playwright/test"
import { e2eCurrentDatabaseAllowed } from "../../lib/env"

function loadLocalEnv() {
  try {
    const text = readFileSync(".env.local", "utf8")
    for (const line of text.split(/\r?\n/)) {
      const index = line.indexOf("=")
      if (index <= 0 || line.startsWith("#")) continue
      const key = line.slice(0, index)
      if (!process.env[key]) process.env[key] = line.slice(index + 1).trim()
    }
  } catch {
    // The shell environment is enough when .env.local is absent.
  }
}

loadLocalEnv()

const allowed = e2eCurrentDatabaseAllowed()
const prefix = process.env.E2E_PREFIX?.trim() || ""
const slug = prefix.toLowerCase()
const email = `${slug}@example.com`
const password = randomBytes(18).toString("base64url")
const outsiderEmail = `${slug}-obs@example.com`
const outsiderPassword = randomBytes(18).toString("base64url")
const shots = "test-results/production-gate"
const notesPath = `${shots}/remainder.json`
const maxLabels = [
  "Plus de 5 ans",
  "Très souvent",
  "Je le fais de façon autonome",
  "Très solide",
  "Avancé",
  "Très régulièrement",
  "Je pilote le suivi budgétaire",
  "Pilotage de projets",
  "Coordination régulière",
  "Responsabilité complète",
]

type Admin = SupabaseClient
const notes: Record<string, string> = {}

test.describe("production remainder on the deployed commit", () => {
  test.skip(!allowed, "NOT TESTED: E2E_ALLOW_CURRENT=1 and E2E_PREFIX=E2E-WOLOYEM-<timestamp> are required.")
  test.describe.configure({ mode: "serial" })
  test.setTimeout(360_000)

  test.beforeAll(async () => {
    mkdirSync(shots, { recursive: true })
    const admin = adminClient()
    await createOwner(admin, email, password, prefix, slug)
    await createOwner(admin, outsiderEmail, outsiderPassword, `${prefix} OBS`, `${slug}-obs`)
  })

  test.afterAll(() => {
    writeFileSync(notesPath, JSON.stringify(notes, null, 2))
  })

  test("excel import updates the draft and the public page only after publish", async ({ page, browser }) => {
    const problems = watch(page)
    const cardSlug = `${slug}-excel`
    const original = `${prefix} excel`
    const edited = `${prefix} excel modifié`
    await login(page, email, password)
    const id = await createScorecard(page, cardSlug, `${prefix} Excel`)
    await page.getByRole("button", { name: /Questions/ }).click()
    await page.getByRole("button", { name: "Ajouter une question" }).click()
    await page.locator("#question-title").fill(original)
    await page.getByLabel("Libellé").fill("Alpha")
    await page.getByLabel("Points").fill("10")
    await page.getByRole("button", { name: "Ajouter une option" }).click()
    await page.getByLabel("Libellé").nth(1).fill("Beta")
    await page.getByLabel("Points").nth(1).fill("30")
    await saved(page)
    await page.getByRole("button", { name: /Résultats/ }).click()
    await page.getByRole("button", { name: "Ajouter une plage" }).click()
    await expect(page.getByLabel("Titre public")).toBeVisible({ timeout: 20_000 })
    await publish(page)

    await expect(async () => {
      await page.goto(`/dashboard/scorecards/${id}`, { waitUntil: "domcontentloaded" })
      await expect(page.getByText(`https://scorapp-xp.vercel.app/s/${cardSlug}`)).toBeVisible()
    }).toPass({ timeout: 30_000 })
    expect(await page.content()).not.toContain("localhost:3000")
    notes.appUrl = "https://scorapp-xp.vercel.app"

    const visitor = await openPublic(browser, cardSlug)
    const publicProblems = watch(visitor.page)
    await begin(visitor.page)
    await expect(visitor.page.getByRole("heading", { name: original })).toBeVisible()

    await page.goto(`/dashboard/scorecards/${id}/builder`)
    await page.getByRole("button", { name: /Questions/ }).click()
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: "Exporter vers Excel" }).click()
    const download = await downloadPromise
    const editedFile = test.info().outputPath("edited.xlsx")
    await rewriteWorkbook(await download.path(), editedFile, original, edited)
    await page.getByRole("button", { name: "Importer des questions" }).click()
    await page.locator('input[type="file"]').setInputFiles(editedFile)
    await expect(page.getByText("Différences")).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/1 modifiée/)).toBeVisible()
    await expect(page.getByText(/texte modifié/)).toBeVisible()
    await expect(page.getByText(/score option modifié/)).toBeVisible()
    await page.getByLabel("Mettre à jour le questionnaire existant").check()
    await page.getByRole("button", { name: "Confirmer l'import" }).click()
    await expect(page.getByText(/Import terminé/)).toBeVisible({ timeout: 30_000 })
    await expect(page.locator("#question-title")).toHaveValue(edited, { timeout: 15_000 })

    await visitor.page.reload()
    await expect(visitor.page.getByRole("heading", { name: original })).toBeVisible()
    await expect(visitor.page.getByText(edited)).toHaveCount(0)
    expect(await visitor.page.content()).not.toContain("localhost:3000")

    await publish(page)
    await visitor.page.reload()
    await expect(visitor.page.getByRole("heading", { name: edited })).toBeVisible({ timeout: 20_000 })
    expect(problems.filter(severe), problems.join("\n")).toEqual([])
    expect(publicProblems.filter(severe), publicProblems.join("\n")).toEqual([])
    await visitor.close()
    notes.excel = "PASS"
  })

  test("conditional questions hide, do not block, and do not score", async ({ page, browser }) => {
    const problems = watch(page)
    const cardSlug = `${slug}-cond`
    await login(page, email, password)
    await createScorecard(page, cardSlug, `${prefix} Conditions`)
    await page.getByRole("button", { name: "Mode avancé" }).click()
    await page.getByRole("button", { name: /Questions/ }).click()
    await addQuestion(page, "Question porte")
    await page.getByLabel("Libellé").fill("A")
    await page.getByLabel("Points").fill("100")
    await page.getByRole("button", { name: "Ajouter une option" }).click()
    await page.getByLabel("Libellé").nth(1).fill("B")
    await page.getByLabel("Points").nth(1).fill("100")
    await saved(page)
    await addQuestion(page, "Question conditionnelle")
    await page.getByLabel("Libellé").fill("Bas")
    await page.getByLabel("Points").fill("0")
    await page.getByRole("button", { name: "Ajouter une option" }).click()
    await page.getByLabel("Libellé").nth(1).fill("Haut")
    await page.getByLabel("Points").nth(1).fill("100")
    await page.getByLabel("Affichage").selectOption("show_if")
    await page.getByLabel("Valeur", { exact: true }).selectOption({ label: "A" })
    await saved(page)
    await page.getByRole("button", { name: /Résultats/ }).click()
    await page.getByRole("button", { name: "Ajouter une plage" }).click()
    await expect(page.getByLabel("Titre public")).toBeVisible({ timeout: 20_000 })
    await publish(page)

    const shown = await openPublic(browser, cardSlug)
    const shownProblems = watch(shown.page)
    await begin(shown.page)
    await expect(shown.page.getByRole("heading", { name: "Question porte" })).toBeVisible()
    await shown.page.getByRole("button", { name: "A", exact: true }).click()
    await expect(shown.page.getByRole("button", { name: "Continuer" })).toBeVisible()
    await shown.page.getByRole("button", { name: "Continuer" }).click()
    await expect(shown.page.getByRole("heading", { name: "Question conditionnelle" })).toBeVisible()
    await shown.page.getByRole("button", { name: "Bas", exact: true }).click()
    await shown.page.getByRole("button", { name: "Terminer" }).click()
    await submitLead(shown.page, email)
    await expect(shown.page.getByText("50 %", { exact: true })).toBeVisible({ timeout: 20_000 })

    const hidden = await openPublic(browser, cardSlug)
    const hiddenProblems = watch(hidden.page)
    await begin(hidden.page)
    await expect(hidden.page.getByRole("heading", { name: "Question porte" })).toBeVisible()
    await hidden.page.getByRole("button", { name: "B", exact: true }).click()
    await expect(hidden.page.getByRole("heading", { name: "Question conditionnelle" })).toHaveCount(0)
    await expect(hidden.page.getByText("Cette question est obligatoire.")).toHaveCount(0)
    await hidden.page.getByRole("button", { name: "Terminer" }).click()
    await submitLead(hidden.page, outsiderEmail)
    await expect(hidden.page.getByText("100 %", { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(hidden.page.getByText("Question conditionnelle")).toHaveCount(0)

    expect(problems.filter(severe), problems.join("\n")).toEqual([])
    expect(shownProblems.filter(severe), shownProblems.join("\n")).toEqual([])
    expect(hiddenProblems.filter(severe), hiddenProblems.join("\n")).toEqual([])
    await shown.close()
    await hidden.close()
    notes.conditional = "PASS"
  })

  test("archive keeps history and the report stays inside the organization", async ({ page, browser }) => {
    const problems = watch(page)
    const cardSlug = `${slug}-hist`
    const historical = `${prefix} question historique`
    const optionLabel = "Option conservée"
    const remaining = `${prefix} question restante`
    await login(page, email, password)
    const id = await createScorecard(page, cardSlug, `${prefix} Historique`)
    await page.getByRole("button", { name: /Questions/ }).click()
    await addQuestion(page, historical)
    await page.getByLabel("Libellé").fill(optionLabel)
    await page.getByLabel("Points").fill("100")
    await saved(page)
    await addQuestion(page, remaining)
    await page.getByLabel("Points").fill("100")
    await saved(page)
    await expect(page.locator("article").getByRole("heading", { name: remaining })).toBeVisible()
    await page.getByRole("button", { name: /Résultats/ }).click()
    await page.getByRole("button", { name: "Ajouter une plage" }).click()
    await expect(page.getByLabel("Titre public")).toBeVisible({ timeout: 20_000 })
    await publish(page)

    const visitor = await openPublic(browser, cardSlug)
    const visitorProblems = watch(visitor.page)
    await expect(async () => {
      const start = visitor.page.getByRole("button", { name: /Commencer/ })
      if (await start.count()) await start.click()
      await expect(visitor.page.getByRole("heading", { name: historical })).toBeVisible()
    }).toPass({ timeout: 40_000 })
    await visitor.page.getByRole("button", { name: optionLabel, exact: true }).click()
    await visitor.page.getByRole("button", { name: "Continuer" }).click()
    await expect(visitor.page.getByRole("heading", { name: remaining })).toBeVisible({ timeout: 20_000 })
    await visitor.page.getByRole("button", { name: /Option 1|Oui/ }).first().click()
    await visitor.page.getByRole("button", { name: "Terminer" }).click()
    await submitLead(visitor.page, email)
    await expect(visitor.page.getByText("%").first()).toBeVisible({ timeout: 20_000 })
    const sessionId = new URL(visitor.page.url()).pathname.split("/results/")[1]?.split("/")[0] ?? ""
    expect(sessionId).not.toEqual("")
    const reportResponse = await visitor.page.goto(`/s/${cardSlug}/results/${sessionId}/report`)
    expect(reportResponse?.status() ?? 0).toBeLessThan(500)
    await expect(visitor.page.getByRole("heading", { name: "Page introuvable" })).toHaveCount(0)
    await expect(visitor.page.locator("article.report-sheet")).toBeVisible({ timeout: 20_000 })
    const preparing = await visitor.page.getByText("Préparation de votre rapport...").count()
    const download = visitor.page.getByRole("link", { name: "Télécharger mon rapport" })
    if (preparing > 0 && (await download.count()) === 0) notes.pdf = "NOT TESTED"
    else if (await download.count()) {
      const pdf = await visitor.page.request.get(await download.getAttribute("href") ?? "")
      notes.pdf = pdf.status() < 500 && pdf.headers()["content-type"]?.includes("pdf") ? "PASS" : "NOT TESTED"
    } else notes.pdf = "NOT TESTED"
    notes.report = "PASS"

    const leak = await browser.newContext()
    const leakPage = await leak.newPage()
    const leakResponse = await leakPage.goto(`/s/pmp-eligibility-4/results/${sessionId}/report`)
    expect(leakResponse?.status() ?? 0).toBe(404)
    await expect(leakPage.getByRole("heading", { name: "Page introuvable" })).toBeVisible()
    await expect(leakPage.getByText(optionLabel)).toHaveCount(0)
    await leak.close()

    const admin = adminClient()
    const lead = await admin.from("leads").select("id").eq("scorecard_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    if (lead.error || !lead.data) throw new Error("Le lead E2E isolé est introuvable.")
    await page.goto(`/dashboard/leads/${lead.data.id}`)
    await expect(page.getByRole("heading", { name: "Réponses" })).toBeVisible()
    await expect(page.getByText(historical)).toBeVisible()
    await expect(page.getByText(optionLabel)).toBeVisible()

    const outsider = await browser.newContext()
    const outsiderPage = await outsider.newPage()
    await login(outsiderPage, outsiderEmail, outsiderPassword)
    const outsiderResponse = await outsiderPage.goto(`/dashboard/leads/${lead.data.id}`)
    expect(outsiderResponse?.status() ?? 0).toBeLessThan(500)
    await expect(outsiderPage.getByText(optionLabel)).toHaveCount(0)
    await expect(outsiderPage.getByText(historical)).toHaveCount(0)
    await outsider.close()

    await page.goto(`/dashboard/scorecards/${id}/builder`)
    await page.getByRole("button", { name: /Questions/ }).click()
    const card = page.locator("article").filter({ hasText: historical })
    await card.getByRole("button", { name: "Supprimer" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Supprimer" }).click()
    await expect(card).toHaveCount(0)
    await publish(page)

    const nextVisitor = await openPublic(browser, cardSlug)
    await expect(async () => {
      const start = nextVisitor.page.getByRole("button", { name: /Commencer/ })
      if (await start.count()) await start.click()
      await expect(nextVisitor.page.getByRole("heading", { name: remaining })).toBeVisible()
    }).toPass({ timeout: 40_000 })
    await expect(nextVisitor.page.getByRole("heading", { name: historical })).toHaveCount(0)
    await nextVisitor.close()

    await page.goto(`/dashboard/leads/${lead.data.id}`)
    await expect(page.getByText(historical)).toBeVisible()
    await expect(page.getByText(optionLabel)).toBeVisible()

    expect(problems.filter(severe), problems.join("\n")).toEqual([])
    expect(visitorProblems.filter(severe), visitorProblems.join("\n")).toEqual([])
    await visitor.close()
    notes.archive = "PASS"
  })

  test("a copied PMP scorecard applies a blocking rule without changing the source", async ({ page }) => {
    const problems = watch(page)
    const cardSlug = `${slug}-pmp`
    await login(page, email, password)
    const id = await createScorecard(page, cardSlug, `${prefix} PMP copie`)
    const admin = adminClient()
    const sourceBefore = await sourceFingerprint(admin)
    await duplicatePmp(admin, id)
    const sourceAfter = await sourceFingerprint(admin)
    expect(sourceAfter).toEqual(sourceBefore)

    await page.reload()
    await page.getByRole("button", { name: "Mode avancé" }).click()
    await page.getByRole("button", { name: "5. Score" }).click()
    await page.getByRole("button", { name: "Ajouter une règle" }).click()
    const rule = page.locator("article").filter({ hasText: "Règle 1" })
    await rule.locator("select").nth(2).selectOption({ label: "Plus de 5 ans" })
    await rule.locator("select").nth(4).selectOption({ label: "Pas encore éligible" })
    await page.getByRole("button", { name: "Enregistrer les règles" }).click()
    await expect(page.getByText("Règles enregistrées.")).toBeVisible({ timeout: 20_000 })
    await page.getByRole("button", { name: /Résultats/ }).click()
    const tester = page.locator("section").filter({ has: page.getByRole("heading", { name: "Tester un résultat" }) }).last()
    const summary = tester.locator("div.rounded-xl").filter({ hasText: "Réponses sélectionnées" })
    const selects = tester.locator("select")
    await expect(selects).toHaveCount(10)
    for (const [index, label] of maxLabels.entries()) await selects.nth(index).selectOption({ label })
    await expect(summary).toContainText("Résultat final : Pas encore éligible")
    const blocked = await summary.innerText()
    expect(blocked).toContain("Résultat avant règle :")
    expect(blocked).not.toContain("Résultat final : Pas encore éligible\nRésultat final : Pas encore éligible")

    await selects.nth(0).selectOption({ label: "3 à 5 ans" })
    await expect(summary).not.toContainText("Résultat final : Pas encore éligible")
    const open = await summary.innerText()
    const before = open.match(/Résultat avant règle : (.+)/)?.[1]
    const final = open.match(/Résultat final : (.+)/)?.[1]
    expect(before).toBeTruthy()
    expect(final).toEqual(before)

    const sourceStill = await sourceFingerprint(admin)
    expect(sourceStill).toEqual(sourceBefore)
    expect(problems.filter(severe), problems.join("\n")).toEqual([])
    notes.pmp = "PASS"
  })

  test("critical pages fit at 375 and 390", async ({ page, browser }) => {
    const cardSlug = `${slug}-excel`
    const widths = [
      { width: 375, height: 812, key: "mobile375" },
      { width: 390, height: 844, key: "mobile390" },
    ] as const
    for (const size of widths) {
      const problems = watch(page)
      await page.context().clearCookies()
      await page.setViewportSize(size)
      await page.goto("/login")
      await noOverflow(page)
      await login(page, email, password)
      await page.setViewportSize(size)
      await page.goto("/dashboard")
      await noOverflow(page)
      await page.goto("/dashboard/scorecards")
      await page.locator("article").getByRole("link", { name: `${prefix} Excel` }).click()
      await page.getByRole("link", { name: "Ouvrir le builder" }).click()
      await page.getByRole("button", { name: /Questions/ }).click()
      await noOverflow(page)
      await page.getByRole("button", { name: "Aperçu", exact: true }).click()
      await noOverflow(page)
      const visitor = await browser.newContext({ viewport: size })
      const publicPage = await visitor.newPage()
      const publicProblems = watch(publicPage)
      await publicPage.goto(`/s/${cardSlug}`)
      await expect(async () => {
        if (await publicPage.getByRole("heading", { name: "Page introuvable" }).count()) await publicPage.reload()
        await expect(publicPage.getByRole("button", { name: /Commencer/ })).toBeVisible()
      }).toPass({ timeout: 20_000 })
      await noOverflow(publicPage)
      await begin(publicPage)
      await noOverflow(publicPage)
      await publicPage.getByRole("button", { name: /Alpha|Beta|Option 1/ }).first().click()
      await publicPage.getByRole("button", { name: "Terminer" }).click()
      const lead = publicPage.locator("form").filter({ has: publicPage.getByRole("heading", { name: "Vos coordonnées" }) })
      await expect(lead).toBeVisible()
      await noOverflow(publicPage)
      await lead.locator('input[name="first_name"]').fill(prefix)
      await lead.locator('input[name="email"]').fill(email)
      const consent = lead.locator('input[type="checkbox"]')
      if (await consent.count()) await consent.check()
      await lead.locator('input[name="email"]').press("Enter")
      await expect(publicPage.getByText("%").first()).toBeVisible({ timeout: 20_000 })
      await noOverflow(publicPage)
      expect(await publicPage.content()).not.toContain("localhost:3000")
      expect(problems.filter(severe), problems.join("\n")).toEqual([])
      expect(publicProblems.filter(severe), publicProblems.join("\n")).toEqual([])
      await visitor.close()
      await page.context().clearCookies()
      notes[size.key] = "PASS"
    }
  })
})

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function createOwner(admin: Admin, ownerEmail: string, ownerPassword: string, name: string, organizationSlug: string) {
  const created = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (created.error && !/already|registered|exists/i.test(created.error.message)) throw new Error("Le compte E2E préfixé n'a pas pu être créé.")
  const member = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const signed = await member.auth.signInWithPassword({ email: ownerEmail, password: ownerPassword })
  if (signed.error) throw new Error("Le compte E2E n'a pas pu ouvrir une session.")
  const organization = await member.rpc("create_organization", {
    p_name: name,
    p_slug: organizationSlug,
    p_use_case: "e2e",
    p_trial_days: 14,
  })
  if (organization.error && !/already|exists|duplicate|unique/i.test(organization.error.message)) throw new Error("L'organisation E2E isolée n'a pas pu être créée.")
}

async function login(page: Page, ownerEmail: string, ownerPassword: string) {
  await page.goto("/login")
  await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(ownerEmail)
  await page.locator("#password").fill(ownerPassword)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
}

async function createScorecard(page: Page, cardSlug: string, name: string) {
  await page.goto("/dashboard/templates")
  await page.getByRole("button", { name: "Créer à partir de ce modèle" }).first().click()
  await page.waitForURL(/\/builder/)
  const id = page.url().split("/scorecards/")[1]?.split("/")[0] ?? ""
  if (!id) throw new Error("La scorecard E2E n'a pas d'identifiant.")
  await page.getByRole("button", { name: /Identité/ }).click()
  await page.locator("#setup-name").fill(name)
  await page.locator("#setup-slug").fill(cardSlug)
  await expect(page.getByText(`/s/${cardSlug}`)).toBeVisible()
  await saved(page)
  return id
}

async function addQuestion(page: Page, title: string) {
  await page.getByRole("button", { name: "Ajouter une question" }).click()
  await expect(page.locator("#question-title")).toHaveValue("Nouvelle question", { timeout: 20_000 })
  await expect(page.getByText("Enregistrement…")).toHaveCount(0, { timeout: 15_000 })
  await page.locator("#question-title").fill(title)
}

async function saved(page: Page) {
  await expect(page.getByText("Enregistrement…")).toBeVisible({ timeout: 8_000 })
  await expect(page.getByText("Enregistré").first()).toBeVisible({ timeout: 15_000 })
}

async function publish(page: Page) {
  await page.getByRole("button", { name: "Publier", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await expect(dialog.getByText("Vérification…")).toHaveCount(0, { timeout: 20_000 })
  const blocked = await dialog.getByRole("heading", { name: "Publication impossible" }).count()
  if (blocked) throw new Error(await dialog.innerText())
  await dialog.getByRole("button", { name: "Publier" }).click()
  await expect(page.getByText("Le questionnaire public utilise maintenant ce contenu")).toBeVisible({ timeout: 20_000 })
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined)
}

async function begin(page: Page) {
  await expect(async () => {
    const start = page.getByRole("button", { name: /Commencer/ })
    if (await start.count()) await start.click()
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible()
  }).toPass({ timeout: 45_000 })
}

async function openPublic(browser: Browser, cardSlug: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`/s/${cardSlug}`)
  await expect(async () => {
    if (await page.getByRole("heading", { name: "Page introuvable" }).count()) await page.reload()
    await expect(page.getByRole("button", { name: /Commencer/ })).toBeVisible()
  }).toPass({ timeout: 20_000 })
  return { page, close: () => context.close() }
}

async function submitLead(page: Page, ownerEmail: string) {
  const lead = page.locator("form").filter({ has: page.getByRole("heading", { name: "Vos coordonnées" }) })
  await expect(lead).toBeVisible()
  await lead.locator('input[name="first_name"]').fill(prefix)
  await lead.locator('input[name="email"]').fill(ownerEmail)
  const consent = lead.locator('input[type="checkbox"]')
  if (await consent.count()) await consent.check()
  await lead.locator('input[name="email"]').press("Enter")
}

async function rewriteWorkbook(source: string, target: string, original: string, edited: string) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(source)
  const sheet = workbook.getWorksheet("Questions")
  if (!sheet) throw new Error("La feuille Questions est absente.")
  const headers = sheet.getRow(1).values as Array<string | undefined>
  const questionColumn = headers.indexOf("question")
  const scoreColumn = headers.indexOf("option_1_score")
  if (questionColumn < 1 || scoreColumn < 1) throw new Error("Les colonnes Excel attendues sont absentes.")
  let found = false
  sheet.eachRow((row, index) => {
    if (index === 1) return
    if (String(row.getCell(questionColumn).value ?? "") !== original) return
    row.getCell(questionColumn).value = edited
    row.getCell(scoreColumn).value = 90
    found = true
  })
  if (!found) throw new Error("La question exportée est introuvable.")
  await workbook.xlsx.writeFile(target)
}

async function sourceFingerprint(admin: Admin) {
  const card = await admin.from("scorecards").select("id, status").eq("slug", "pmp-eligibility-4").single()
  if (card.error || !card.data) throw new Error("La scorecard PMP source est introuvable.")
  const [rules, option, questions] = await Promise.all([
    admin.from("scoring_rules").select("id", { count: "exact", head: true }).eq("scorecard_id", card.data.id),
    admin.from("questions").select("id").eq("scorecard_id", card.data.id).eq("title", "Combien d'années d'expérience avez-vous en gestion de projet ?").maybeSingle(),
    admin.from("questions").select("id", { count: "exact", head: true }).eq("scorecard_id", card.data.id).is("archived_at", null),
  ])
  if (!option.data) throw new Error("La question source PMP est introuvable.")
  const score = await admin.from("question_options").select("score").eq("question_id", option.data.id).eq("label", "3 à 5 ans").maybeSingle()
  return { status: card.data.status, rules: rules.count ?? 0, questions: questions.count ?? 0, yearsScore: score.data?.score ?? null }
}

async function duplicatePmp(admin: Admin, targetId: string) {
  const card = await admin.from("scorecards").select("id").eq("slug", "pmp-eligibility-4").single()
  if (card.error || !card.data) throw new Error("La scorecard PMP source est introuvable.")
  const sourceId = card.data.id
  const [questions, ranges, scoring, categories] = await Promise.all([
    admin.from("questions").select("id, question_category_id, scoring_category_id, type, title, description, is_required, is_scored, position, settings").eq("scorecard_id", sourceId).is("archived_at", null).order("position"),
    admin.from("result_ranges").select("min_percent, max_percent, label, title, description, badge, position").eq("scorecard_id", sourceId),
    admin.from("scoring_categories").select("id, name, description, weight, max_score, high_message, medium_message, low_message, position").eq("scorecard_id", sourceId),
    admin.from("question_categories").select("id, name, description, icon, weight, position").eq("scorecard_id", sourceId),
  ])
  if (questions.error || ranges.error || scoring.error || categories.error) throw new Error("La lecture de la copie PMP a échoué.")
  const options = await admin.from("question_options").select("id, question_id, label, value, score, position").in("question_id", (questions.data ?? []).map((question) => question.id)).is("archived_at", null)
  if (options.error) throw new Error("Les options PMP n'ont pas pu être lues.")
  const map = new Map<string, string>()
  const nextId = (id: string | null) => {
    if (!id) return null
    const current = map.get(id)
    if (current) return current
    const created = randomUUID()
    map.set(id, created)
    return created
  }
  for (const category of categories.data ?? []) nextId(category.id)
  for (const category of scoring.data ?? []) nextId(category.id)
  for (const question of questions.data ?? []) nextId(question.id)
  for (const option of options.data ?? []) nextId(option.id)
  const remap = (value: unknown) => {
    let text = JSON.stringify(value ?? {})
    for (const [from, to] of map) text = text.replaceAll(from, to)
    return JSON.parse(text)
  }
  if ((categories.data ?? []).length > 0) {
    const inserted = await admin.from("question_categories").insert((categories.data ?? []).map((category) => ({
      id: nextId(category.id),
      scorecard_id: targetId,
      name: category.name,
      description: category.description,
      icon: category.icon,
      weight: category.weight,
      position: category.position,
    })))
    if (inserted.error) throw new Error("Les catégories de la copie n'ont pas pu être créées.")
  }
  if ((scoring.data ?? []).length > 0) {
    const inserted = await admin.from("scoring_categories").insert((scoring.data ?? []).map((category) => ({
      id: nextId(category.id),
      scorecard_id: targetId,
      name: category.name,
      description: category.description,
      weight: category.weight,
      max_score: category.max_score,
      high_message: category.high_message,
      medium_message: category.medium_message,
      low_message: category.low_message,
      position: category.position,
    })))
    if (inserted.error) throw new Error("Les catégories de scoring de la copie n'ont pas pu être créées.")
  }
  const questionRows = (questions.data ?? []).map((question) => ({
    id: nextId(question.id),
    scorecard_id: targetId,
    question_category_id: nextId(question.question_category_id),
    scoring_category_id: nextId(question.scoring_category_id),
    type: question.type,
    title: question.title,
    description: question.description,
    is_required: question.is_required,
    is_scored: question.is_scored,
    position: question.position,
    settings: remap(question.settings),
    archived_at: null,
  }))
  const insertedQuestions = await admin.from("questions").insert(questionRows)
  if (insertedQuestions.error) throw new Error("Les questions de la copie n'ont pas pu être créées.")
  const insertedOptions = await admin.from("question_options").insert((options.data ?? []).map((option) => ({
    id: nextId(option.id),
    question_id: nextId(option.question_id),
    label: option.label,
    value: option.value,
    score: option.label === "3 à 5 ans" ? 100 : option.score,
    position: option.position,
    archived_at: null,
  })))
  if (insertedOptions.error) throw new Error("Les options de la copie n'ont pas pu être créées.")
  const copiedRanges = await admin.from("result_ranges").insert([
    ...(ranges.data ?? []).map((range) => ({ ...range, scorecard_id: targetId })),
    {
      scorecard_id: targetId,
      min_percent: 0,
      max_percent: 39,
      label: "Pas encore éligible",
      title: "Pas encore éligible",
      description: null,
      badge: null,
      position: 20,
    },
  ])
  if (copiedRanges.error) throw new Error("Les résultats de la copie n'ont pas pu être créés.")
}

function watch(page: Page) {
  const problems: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => problems.push(`page: ${error.message}`))
  page.on("response", (response) => {
    if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`)
  })
  return problems
}

function severe(problem: string) {
  if (problem.startsWith("console:") && /favicon|Download the React DevTools|unsafe-eval/i.test(problem)) return false
  if (/^404 /.test(problem) && /favicon|_next\/|\.map|webpack/i.test(problem)) return false
  return true
}

async function noOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, "horizontal overflow").toBeLessThanOrEqual(1)
}
