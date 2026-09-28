import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { guideCardIds, guideChapters, GUIDE_ROUTES, buildGuideIndex, guideLinks, guideSearchKey, searchGuide } from "./index.ts"

const faqTitles = [
  "Comment créer ma première scorecard ?",
  "Pourquoi mes modifications ne sont-elles pas visibles publiquement ?",
  "Comment tester avant de publier ?",
  "Comment modifier le score ?",
  "Quelle différence entre catégorie et catégorie de scoring ?",
  "Comment fonctionnent les règles obligatoires ?",
  "Comment récupérer un lead supprimé ?",
  "Puis-je annuler une anonymisation ?",
  "Comment générer un QR Code ?",
  "Comment inviter un membre ?",
  "Quel rôle donner à un membre ?",
  "Comment importer des questions avec Excel ?",
  "Pourquoi une fonctionnalité est-elle indisponible ?",
  "Comment utiliser un domaine personnalisé ?",
]

const steps = [
  "Créer une scorecard",
  "Configurer son identité",
  "Construire la page d'accueil",
  "Ajouter les questions",
  "Configurer l'affichage conditionnel",
  "Organiser les catégories",
  "Configurer le scoring",
  "Configurer les plages de résultats",
  "Configurer les règles obligatoires",
  "Configurer la collecte des contacts",
  "Tester avec Aperçu",
  "Publier et partager",
]

test("guide search ranks the documented destinations first", () => {
  const first = (query: string) => searchGuide(guideChapters, query)[0]
  assert.equal(first("qr").title, "Publier et partager une scorecard")
  assert.equal(first("qr code").title, "Publier et partager une scorecard")
  assert.equal(first("lead supprimé").title, "Corbeille et restauration")
  assert.equal(first("score").title, "Scoring et résultats")
  assert.equal(first("scoring").title, "Scoring et résultats")
  assert.equal(first("scores").title, "Scoring et résultats")
  assert.equal(first("excel").title, "Import / Export Excel")
  assert.equal(first("membre").title, "Équipe et permissions")
  assert.equal(first("equipe").title, "Équipe et permissions")
  assert.equal(first("domaine").title, "Domaine personnalisé")
  assert.equal(first("publication").title, "Draft / Published")
  assert.equal(first("scor").title, "Scoring et résultats")
  assert.equal(searchGuide(guideChapters, "q").length, 0)
  assert.equal(searchGuide(guideChapters, "zzzqq").length, 0)
})

test("guide index is local and keyboard navigation stays bounded", () => {
  const entry = buildGuideIndex(guideChapters).find((item) => item.id === "scoring-configurer-le-scoring")
  assert.ok(entry)
  assert.equal(entry?.chapter, "Scoring et résultats")
  assert.equal(entry?.title, "Configurer le scoring")
  assert.equal(entry?.href, "#scoring-configurer-le-scoring")
  assert.ok(entry?.keywords.includes("score"))
  assert.ok(entry && entry.excerpt.length > 20)
  assert.equal(guideSearchKey("ArrowDown", -1, 3)?.index, 0)
  assert.equal(guideSearchKey("ArrowDown", 2, 3)?.index, 2)
  assert.equal(guideSearchKey("ArrowUp", 0, 3)?.index, 0)
  assert.equal(guideSearchKey("Enter", -1, 3)?.type, "open")
  assert.equal(guideSearchKey("Escape", 1, 3)?.type, "close")
  const source = readFileSync(new URL("./search.ts", import.meta.url), "utf8")
  assert.equal(source.includes("supabase"), false)
})

test("guide chapters, steps, questions and FAQ stay complete", () => {
  assert.deepEqual(guideCardIds.map((id) => guideChapters.find((chapter) => chapter.id === id)?.title), [
    "Bien démarrer",
    "Créer ma première scorecard",
    "Questions et logique conditionnelle",
    "Scoring et résultats",
    "Leads et CRM",
    "Analytics",
    "Rapports",
    "Équipe et permissions",
    "Paramètres",
    "Import / Export Excel",
  ])
  const tutorial = guideChapters.find((chapter) => chapter.id === "premiere-scorecard")
  assert.deepEqual(tutorial?.sections.map((section) => section.title), steps)
  const names = guideChapters.flatMap((chapter) => chapter.sections.flatMap((section) => section.blocks.flatMap((block) => block.type === "questions" ? block.items.map((item) => item.name) : [])))
  assert.deepEqual(names, [
    "Choix unique",
    "Choix multiple",
    "Oui / Non",
    "Échelle 1–5",
    "Échelle 1–10",
    "Texte court",
    "Texte long",
    "Nombre",
    "Email",
    "Téléphone",
    "Pays",
    "Liste déroulante",
  ])
  const faq = guideChapters.find((chapter) => chapter.id === "faq")
  assert.deepEqual(faq?.sections.map((section) => section.title), faqTitles)
})

test("guide links stay on existing dashboard routes", () => {
  const hrefs = guideLinks(guideChapters)
  assert.ok(hrefs.length > 0)
  for (const href of hrefs) {
    assert.ok(GUIDE_ROUTES.includes(href as (typeof GUIDE_ROUTES)[number]), href)
    const path = href.split("?")[0].replace(/^\//, "")
    assert.equal(existsSync(`app/${path}/page.tsx`), true, href)
  }
})

test("guide text does not present excluded features as available", () => {
  const text = JSON.stringify(guideChapters)
  assert.equal(text.includes("/platform"), false)
  assert.equal(/support session/i.test(text), false)
  assert.equal(/plan internal/i.test(text), false)
  assert.equal(/supprimer l'organisation/i.test(text), false)
  assert.equal(/email est envoyé automatiquement/i.test(text), false)
  assert.match(text, /n'est pas réversible/)
  assert.match(text, /peut être restauré/)
  assert.match(text, /n'est pas garanti/)
  assert.equal(text.includes("@"), false)
})
