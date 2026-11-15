import sharp from "sharp"
import fs from "fs"
import path from "path"

const root = process.cwd()
const srcIcon = path.join(root, "public/brand/source/icone-app.png.png")
const outDir = path.join(root, "public/icons")
fs.mkdirSync(outDir, { recursive: true })

function pngIco(buffers) {
  const count = buffers.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)
  const entries = []
  let offset = 6 + count * 16
  for (const { size, png } of buffers) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += png.length
  }
  return Buffer.concat([header, ...entries, ...buffers.map((b) => b.png)])
}

const bbox = { left: 100, top: 100, width: 360, height: 360 }
const cropped = sharp(srcIcon).extract(bbox)

await cropped.clone().resize(512, 512).png().toFile(path.join(root, "app/icon.png"))
await cropped.clone().resize(512, 512).png().toFile(path.join(outDir, "icon-512.png"))
await cropped.clone().resize(192, 192).png().toFile(path.join(outDir, "icon-192.png"))
await cropped.clone().resize(180, 180).png().toFile(path.join(root, "app/apple-icon.png"))

const maskInner = await cropped.clone().resize(410, 410).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 28, g: 35, b: 64, alpha: 1 } },
})
  .composite([{ input: maskInner, left: 51, top: 51 }])
  .png()
  .toFile(path.join(outDir, "icon-maskable-512.png"))

const png32 = await cropped.clone().resize(32, 32).png().toBuffer()
const png48 = await cropped.clone().resize(48, 48).png().toBuffer()

const simple16Svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect width="16" height="16" rx="3" fill="#1c2340"/>
    <text x="8" y="12.2" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="11" fill="#ffffff">M</text>
  </svg>`,
)
const simple16 = await sharp(simple16Svg).png().toBuffer()

const ico = pngIco([
  { size: 16, png: simple16 },
  { size: 32, png: png32 },
  { size: 48, png: png48 },
])
fs.writeFileSync(path.join(root, "app/favicon.ico"), ico)

await cropped.clone().resize(16, 16).png().toFile(path.join(outDir, "favicon-16-full.png"))
await sharp(simple16).toFile(path.join(outDir, "favicon-16-simple.png"))

const logoMark = await cropped.clone().resize(220, 220).png().toBuffer()
const ogSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#1c2340"/>
  <text x="600" y="400" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#ffffff">mawaki <tspan fill="#60a5fa">score</tspan></text>
  <text x="600" y="455" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600" letter-spacing="6" fill="#a7aab5">SCORECARDS · PILOTAGE</text>
</svg>`,
)
await sharp(ogSvg)
  .composite([{ input: logoMark, left: 490, top: 110 }])
  .png()
  .toFile(path.join(root, "app/opengraph-image.png"))

const oldSvg = path.join(root, "app/icon.svg")
if (fs.existsSync(oldSvg)) fs.unlinkSync(oldSvg)

console.log("ICONS_OK")
console.log({
  favicon: fs.statSync(path.join(root, "app/favicon.ico")).size,
  icon: fs.statSync(path.join(root, "app/icon.png")).size,
  apple: fs.statSync(path.join(root, "app/apple-icon.png")).size,
  og: fs.statSync(path.join(root, "app/opengraph-image.png")).size,
})
