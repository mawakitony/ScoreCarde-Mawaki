import { blockText, type Chapter } from "./types"

export const GUIDE_SEARCH_MIN = 2
export const GUIDE_SEARCH_DEBOUNCE_MS = 200

export type GuideEntry = {
  id: string
  chapterId: string
  sectionId: string
  chapter: string
  title: string
  subtitle: string
  keywords: string[]
  excerpt: string
  href: string
  kind: "chapter" | "section" | "alias"
}

export type GuideHit = GuideEntry & { score: number }

const ALIASES: { chapterId: string; sectionId: string; title: string; keywords: string[] }[] = [
  {
    chapterId: "premiere-scorecard",
    sectionId: "publier-et-partager",
    title: "Publier et partager une scorecard",
    keywords: ["qr", "qr code", "partage", "whatsapp"],
  },
  {
    chapterId: "leads",
    sectionId: "supprimer-et-restaurer",
    title: "Corbeille et restauration",
    keywords: ["lead supprimé", "corbeille", "restauration", "restaurer"],
  },
  {
    chapterId: "premiere-scorecard",
    sectionId: "publier-et-partager",
    title: "Brouillon / Publiée",
    keywords: ["publication", "draft", "published", "brouillon", "publiée"],
  },
]

export function normalizeGuideQuery(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

export function guideAnchor(chapterId: string, sectionId: string) {
  return `${chapterId}-${sectionId}`
}

export function sectionHeading(chapter: Chapter, section: Chapter["sections"][number], index: number) {
  return chapter.numbered ? `Étape ${index + 1} — ${section.title}` : section.title
}

function tokens(value: string) {
  return normalizeGuideQuery(value).split(" ").filter((token) => token.length >= 2)
}

function foldPlural(token: string) {
  return token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token
}

function sameToken(left: string, right: string) {
  return foldPlural(left) === foldPlural(right)
}

function sharedPrefix(left: string, right: string) {
  const limit = Math.min(left.length, right.length)
  let count = 0
  while (count < limit && left[count] === right[count]) count += 1
  return count
}

function strength(token: string, words: string[]) {
  let best = 0
  for (const word of words) {
    if (sameToken(word, token)) best = Math.max(best, 5)
    else if (word.startsWith(token) && token.length >= 3) best = Math.max(best, 3)
    else if (token.startsWith(word) && word.length >= 4) best = Math.max(best, 3)
    else if (sharedPrefix(word, token) >= 5) best = Math.max(best, 2)
  }
  return best
}

function excerptFrom(chapter: Chapter, section: Chapter["sections"][number]) {
  const paragraph = section.blocks.find((block) => block.type === "p")
  const text = paragraph && paragraph.type === "p" ? paragraph.text : section.blocks.map(blockText).join(" ")
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}...` : clean
}

export function buildGuideIndex(chapters: Chapter[]): GuideEntry[] {
  const entries: GuideEntry[] = []
  for (const chapter of chapters) {
    entries.push({
      id: `chapter-${chapter.id}`,
      chapterId: chapter.id,
      sectionId: chapter.id,
      chapter: chapter.title,
      title: chapter.title,
      subtitle: chapter.description,
      keywords: chapter.keywords,
      excerpt: chapter.description,
      href: `#${chapter.id}`,
      kind: "chapter",
    })
    chapter.sections.forEach((section, index) => {
      entries.push({
        id: guideAnchor(chapter.id, section.id),
        chapterId: chapter.id,
        sectionId: section.id,
        chapter: chapter.title,
        title: sectionHeading(chapter, section, index),
        subtitle: chapter.description,
        keywords: [...section.keywords, ...chapter.keywords],
        excerpt: excerptFrom(chapter, section),
        href: `#${guideAnchor(chapter.id, section.id)}`,
        kind: "section",
      })
    })
  }
  for (const alias of ALIASES) {
    const chapter = chapters.find((item) => item.id === alias.chapterId)
    const section = chapter?.sections.find((item) => item.id === alias.sectionId)
    if (!chapter || !section) continue
    entries.push({
      id: `alias-${guideAnchor(alias.chapterId, alias.sectionId)}-${normalizeGuideQuery(alias.title).replace(/ /g, "-")}`,
      chapterId: alias.chapterId,
      sectionId: alias.sectionId,
      chapter: chapter.title,
      title: alias.title,
      subtitle: chapter.description,
      keywords: alias.keywords,
      excerpt: excerptFrom(chapter, section),
      href: `#${guideAnchor(alias.chapterId, alias.sectionId)}`,
      kind: "alias",
    })
  }
  return entries
}

export function searchGuide(chapters: Chapter[], query: string): GuideHit[] {
  const needle = normalizeGuideQuery(query)
  if (needle.length < GUIDE_SEARCH_MIN) return []
  const queryTokens = tokens(needle)
  if (queryTokens.length === 0) return []
  const hits: GuideHit[] = []
  for (const entry of buildGuideIndex(chapters)) {
    const titleWords = tokens(entry.title)
    const keywordWords = entry.keywords.flatMap((keyword) => tokens(keyword))
    const bodyWords = tokens(`${entry.subtitle} ${entry.excerpt}`)
    let score = 0
    let matched = true
    for (const token of queryTokens) {
      const titleHit = strength(token, titleWords)
      const keywordHit = strength(token, keywordWords)
      const bodyHit = strength(token, bodyWords)
      if (Math.max(titleHit, keywordHit, bodyHit) === 0) {
        matched = false
        break
      }
      score += titleHit * 3 + keywordHit * 2 + Math.min(bodyHit, 3)
    }
    if (!matched) continue
    if (entry.keywords.some((keyword) => sameToken(normalizeGuideQuery(keyword), needle))) score += 12
    if (sameToken(normalizeGuideQuery(entry.title), needle)) score += 10
    if (entry.kind === "chapter") {
      score += 4
      const first = titleWords[0]
      if (first && queryTokens.some((token) => {
        const form = foldPlural(token)
        return sameToken(first, token) || (form.length >= 3 && first.startsWith(form))
      })) score += 14
    }
    if (entry.kind === "alias" && entry.keywords.some((keyword) => sameToken(normalizeGuideQuery(keyword), needle))) score += 24
    hits.push({ ...entry, score })
  }
  const sorted = hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "fr"))
  const seen = new Set<string>()
  return sorted.filter((hit) => {
    if (seen.has(hit.href)) return false
    seen.add(hit.href)
    return true
  })
}

export function guideSearchKey(key: string, index: number, count: number) {
  if (key === "Escape") return { type: "close" as const, index: -1 }
  if (key === "ArrowDown" && count > 0) return { type: "move" as const, index: index < 0 ? 0 : Math.min(count - 1, index + 1) }
  if (key === "ArrowUp" && count > 0) return { type: "move" as const, index: index <= 0 ? 0 : index - 1 }
  if (key === "Enter" && count > 0) return { type: "open" as const, index: index < 0 ? 0 : index }
  return null
}

export function guideLinks(chapters: Chapter[]) {
  const hrefs: string[] = []
  for (const chapter of chapters) {
    for (const section of chapter.sections) {
      for (const block of section.blocks) {
        if (block.type === "links") hrefs.push(...block.items.map((item) => item.href))
      }
    }
  }
  return hrefs
}
