/**
 * Lot 8D — measure real widths / computed styles before fixing.
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot8d")

async function measure(page, label) {
  return page.evaluate((tag) => {
    const pick = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        tag: el.tagName,
        id: el.id || null,
        className: typeof el.className === "string" ? el.className.slice(0, 160) : "",
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        display: cs.display,
        width: cs.width,
        maxWidth: cs.maxWidth,
        gridTemplateColumns: cs.gridTemplateColumns,
        containerType: cs.containerType,
        transform: cs.transform,
        overflow: cs.overflow,
        overflowX: cs.overflowX,
      }
    }

    const main = document.querySelector("main")
    const chrome = document.querySelector("[data-landing-chrome]") || main?.firstElementChild
    const shell = document.querySelector("[data-dx-shell]")
    const hero = document.querySelector("[data-dx-hero]")
    const copy = document.querySelector("[data-dx-copy]")
    const visual = document.querySelector("[data-dx-visual]")
    const mockup = document.querySelector("[data-dx-mockup]")

    const chain = []
    let node = hero || chrome
    while (node && node !== document.documentElement) {
      chain.push(pick(node))
      node = node.parentElement
    }

    return {
      label: tag,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      body: pick(document.body),
      html: pick(document.documentElement),
      main: pick(main),
      chrome: pick(chrome),
      shell: pick(shell),
      hero: pick(hero),
      copy: pick(copy),
      visual: pick(visual),
      mockup: pick(mockup),
      ancestors: chain,
    }
  }, label)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const results = {}
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
    await page.waitForTimeout(500)
    results[`viewport-${width}`] = await measure(page, `viewport-${width}`)
    await page.screenshot({ path: path.join(OUT, `before-${width}.png`), fullPage: true })
  }

  await writeFile(path.join(OUT, "measure-before.json"), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
