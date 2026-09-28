import { analyticsChapter } from "./chapters/analytics"
import { excelChapter } from "./chapters/excel"
import { faqChapter } from "./chapters/faq"
import { leadsChapter } from "./chapters/leads"
import { productSearchChapter } from "./chapters/product-search"
import { questionsChapter } from "./chapters/questions"
import { reportsChapter } from "./chapters/reports"
import { scorecardChapter } from "./chapters/scorecard"
import { scoringChapter } from "./chapters/scoring"
import { settingsChapter } from "./chapters/settings"
import { startChapter } from "./chapters/start"
import { teamChapter } from "./chapters/team"
import type { Chapter } from "./types"

export const guideChapters: Chapter[] = [
  startChapter,
  scorecardChapter,
  questionsChapter,
  scoringChapter,
  leadsChapter,
  analyticsChapter,
  reportsChapter,
  teamChapter,
  settingsChapter,
  excelChapter,
  productSearchChapter,
  faqChapter,
]

export const guideCardIds = [
  "bien-demarrer",
  "premiere-scorecard",
  "questions",
  "scoring",
  "leads",
  "analytics",
  "rapports",
  "equipe",
  "parametres",
  "excel",
] as const

export { GUIDE_ROUTES, blockText, type Chapter, type GuideRoute, type Section } from "./types"
export { GUIDE_SEARCH_DEBOUNCE_MS, GUIDE_SEARCH_MIN, buildGuideIndex, guideAnchor, guideLinks, guideSearchKey, searchGuide, sectionHeading } from "./search"
