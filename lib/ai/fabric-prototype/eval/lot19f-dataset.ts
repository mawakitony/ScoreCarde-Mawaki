import type { EvalScenario } from "@/lib/ai/fabric-prototype/eval/dataset"

/**
 * LOT 19F — 4 synthetic action-plan scenarios (fictional only).
 */

const plan = (
  id: string,
  name: string,
  description: string,
  input: Record<string, unknown>,
  category: EvalScenario["expectations"]["category"] = "happy",
  extras: { mustRequireArbitration?: boolean } = {},
): EvalScenario => ({
  id: `d19f_plan_${id}`,
  patternId: "generate_action_plan",
  name,
  description,
  input: { locale: "fr", strengths: [], gaps: [], constraints: [], ...input },
  expectations: {
    category,
    mustPassZodWhenOk: true,
    mustHaveThreePriorities: true,
    mustRequireArbitration: extras.mustRequireArbitration,
  },
})

export const LOT19F_DATASET: EvalScenario[] = [
  plan("skills", "Compétences gestion de projet", "Lacunes risques / communication / planification", {
    situationSummary:
      "Diagnostic synthétique d'une équipe projet fictive : lacunes en gestion des risques, communication parties prenantes irrégulière et planification des jalons peu formalisée. Bases techniques correctes.",
    useCase: "developpement_competences",
    strengths: ["Bases techniques correctes", "Motivation individuelle"],
    gaps: [
      "Gestion des risques peu structurée",
      "Communication parties prenantes irrégulière",
      "Planification des jalons peu formalisée",
    ],
    constraints: ["Budget formation limité", "Disponibilité 3h/semaine"],
  }),
  plan("pmo", "Maturité PMO", "Trop de reporting, peu d'indicateurs décisionnels", {
    situationSummary:
      "Organisation fictive dont le PMO produit un volume élevé de reporting opérationnel mais manque d'indicateurs utiles à l'arbitrage et à la priorisation du portefeuille.",
    useCase: "maturite_organisationnelle",
    strengths: ["Discipline de reporting établie", "Sponsor direction présent"],
    gaps: [
      "Indicateurs peu orientés décision",
      "Priorisation de portefeuille floue",
      "Temps passé en reporting au détriment de l'arbitrage",
    ],
    constraints: ["Pas de nouvel outil cette année", "Équipe PMO de 3 personnes"],
  }),
  plan("digital", "Transformation digitale", "Adoption outils et coordination équipes", {
    situationSummary:
      "Organisation fictive en transformation digitale : adoption inégale des outils collaboratifs et coordination inter-équipes insuffisante, malgré un sponsor digital identifié.",
    useCase: "maturite_organisationnelle",
    strengths: ["Sponsor digital identifié", "Quelques équipes déjà à l'aise avec les outils"],
    gaps: [
      "Adoption inégale des outils",
      "Coordination inter-équipes insuffisante",
      "Manque de rituels de suivi communs",
    ],
    constraints: ["Pas de recrutement IT immédiat", "Changement progressif exigé"],
  }),
  plan(
    "competing",
    "Priorités concurrentes",
    "Ressources limitées, plusieurs problèmes simultanés",
    {
      situationSummary:
        "Organisation fictive aux ressources limitées confrontée simultanément à une baisse de satisfaction client, des coûts opérationnels élevés et une concentration des compétences critiques — sans arbitrage fourni.",
      useCase: "performance_equipe",
      strengths: ["Équipe motivée", "Process de base documentés"],
      gaps: [
        "Satisfaction client en baisse",
        "Coûts opérationnels élevés",
        "Compétences critiques concentrées sur peu de personnes",
      ],
      constraints: ["Budget unique pour un seul chantier majeur", "Délai 90 jours"],
    },
    "edge",
    { mustRequireArbitration: true },
  ),
]

export function lot19fDatasetSummary() {
  return {
    total: LOT19F_DATASET.length,
    ids: LOT19F_DATASET.map((s) => s.id),
    allActionPlan: LOT19F_DATASET.every((s) => s.patternId === "generate_action_plan"),
  }
}
