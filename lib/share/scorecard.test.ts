import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import jsQR from "jsqr"
import { PNG } from "pngjs"
import { SHARE_BLOCKED, qrDownloadName, scorecardShareTarget } from "./scorecard.ts"
import { SCORECARD_QR, scorecardQrPng } from "./qr.ts"

const appUrl = "https://score.woloyem.com"
const organizationId = "11111111-1111-4111-8111-111111111111"
const otherOrganizationId = "22222222-2222-4222-8222-222222222222"
const slug = "eligibilite-pmp"
const name = "Éligibilité PMP"
const platform = `${appUrl}/s/${slug}`
const secret = "tok-secret"
const email = "person@example.com"
const leadId = "33333333-3333-4333-8333-333333333333"

function target(status: string, domain: { domain: string; organizationId: string; status: string } | null) {
  return scorecardShareTarget({ appUrl, slug, name, status, organizationId, domain })
}

async function decode(url: string) {
  const png = await scorecardQrPng(url)
  const image = PNG.sync.read(png)
  const code = jsQR(new Uint8ClampedArray(image.data), image.width, image.height)
  return { image, value: code?.data ?? "" }
}

test("une scorecard publiée peut être partagée et un brouillon est refusé", () => {
  const published = target("published", null)
  assert.equal(published.shareable, true)
  const draft = target("draft", null)
  assert.equal(draft.shareable, false)
  if (!draft.shareable) assert.equal(draft.message, SHARE_BLOCKED)
  assert.equal(target("paused", null).shareable, false)
})

test("l'URL plateforme et le domaine vérifié sont canoniques", () => {
  const plain = target("published", null)
  if (!plain.shareable) assert.fail("partage attendu")
  assert.equal(plain.url, platform)
  const custom = target("published", { domain: "score.client.com", organizationId, status: "verified" })
  if (!custom.shareable) assert.fail("partage attendu")
  assert.equal(custom.url, "https://score.client.com/eligibilite-pmp")
})

test("un domaine pending ou d'une autre organisation reste sur la plateforme", () => {
  for (const domain of [
    { domain: "score.client.com", organizationId, status: "pending" },
    { domain: "score.client.com", organizationId, status: "failed" },
    { domain: "score.client.com", organizationId, status: "disabled" },
    { domain: "score.other.com", organizationId: otherOrganizationId, status: "verified" },
  ]) {
    const share = target("published", domain)
    if (!share.shareable) assert.fail("partage attendu")
    assert.equal(share.url, platform)
    assert.equal(share.url.includes(domain.domain), false)
  }
})

test("le QR contient exactement l'URL publique et aucune donnée privée", async () => {
  const share = target("published", { domain: "score.client.com", organizationId, status: "verified" })
  if (!share.shareable) assert.fail("partage attendu")
  const decoded = await decode(share.url)
  assert.equal(decoded.image.width, SCORECARD_QR.width)
  assert.equal(decoded.image.height, SCORECARD_QR.width)
  assert.equal(decoded.value, share.url)
  assert.equal(new URL(decoded.value).search, "")
  const payload = `${decoded.value} ${secret} ${email} ${leadId} ${organizationId}`
  assert.equal(decoded.value.includes(secret), false)
  assert.equal(decoded.value.includes(email), false)
  assert.equal(decoded.value.includes(leadId), false)
  assert.equal(decoded.value.includes(organizationId), false)
  assert.equal(decoded.value === share.url, true)
  assert.equal(payload.includes(secret), true)
})

test("WhatsApp contient le nom et l'URL, et le PNG a le bon nom", () => {
  const share = target("published", null)
  if (!share.shareable) assert.fail("partage attendu")
  assert.match(share.message, new RegExp(name))
  assert.match(share.message, new RegExp(platform.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.equal(share.whatsApp.startsWith("https://wa.me/?text="), true)
  const text = decodeURIComponent(share.whatsApp.slice("https://wa.me/?text=".length))
  assert.equal(text, share.message)
  assert.equal(text.includes(secret), false)
  assert.equal(text.includes("first-access"), false)
  assert.equal(text.includes(email), false)
  assert.equal(share.mailto.startsWith("mailto:?subject="), true)
  assert.equal(decodeURIComponent(share.mailto).includes(platform), true)
  assert.equal(share.fileName, "woloyem-score-eligibilite-pmp-qr.png")
  assert.equal(qrDownloadName(slug), share.fileName)
})

test("le partage serveur ne journalise pas et ne copie plus l'URL brute", () => {
  const action = readFileSync(new URL("../../actions/share.ts", import.meta.url), "utf8")
  const table = readFileSync(new URL("../../components/scorecard/scorecards-table.tsx", import.meta.url), "utf8")
  const shareModule = readFileSync(new URL("./scorecard.ts", import.meta.url), "utf8")
  assert.match(action, /loadScorecardShare\(scorecardId: string\)/)
  assert.match(action, /membership\.organization\.id/)
  assert.match(action, /\.eq\("status", "verified"\)/)
  assert.equal(action.includes("audit_logs"), false)
  assert.equal(action.includes("firstAccessShareMessage"), false)
  assert.equal(shareModule.includes("firstAccessShareMessage"), false)
  assert.equal(table.includes("navigator.clipboard.writeText"), false)
  assert.match(table, /Partager/)
})
