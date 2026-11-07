import type {
  AnalyzeScorecardResultsOutput,
  GenerateActionPlanOutput,
  GenerateScorecardDraftOutput,
  GenerateScorecardDraftSuggestion,
} from "@/lib/ai/fabric-prototype/schemas"
import { shouldRequireArbitration } from "@/lib/ai/fabric-prototype/business-guards"

export function pickFixtureKey(blob: string): string {
  const lower = blob.toLowerCase()
  if (/ignore\s+all\s+instructions|system\s*prompt|révél|secret|autre\s+tenant|other\s+tenant/.test(lower)) {
    return "malicious"
  }
  if (
    /leadership.{0,60}ou.{0,60}vente|vente.{0,60}ou.{0,60}leadership|ambigu|pas\s+sûr|je\s+ne\s+sais\s+pas|undefined need/.test(
      lower,
    )
  ) {
    return "ambiguous"
  }
  if (/pmp|gestion\s+de\s+projet|project\s+management|certif/.test(lower)) return "competency"
  if (/pmo|maturité\s+pmo/.test(lower)) return "org"
  if (/commercial|prospect|lead|qualification|vente/.test(lower)) return "sales"
  if (/organisation|maturité|diagnostic|processus/.test(lower)) return "org"
  if (/formation|apprentissage|training/.test(lower)) return "training"
  if (/faible|low\s+score|28%|score.?=?\s*2[0-9]/.test(lower)) return "low"
  if (/élevé|high\s+score|88%|score.?=?\s*8[5-9]|9[0-9]/.test(lower)) return "high"
  if (/déséquilibr|imbalanc|écart/.test(lower)) return "imbalanced"
  if (/partiel|missing|incomplet/.test(lower)) return "partial"
  if (/incohérent|inconsistent|120%/.test(lower)) return "inconsistent"
  if (/moyen|55%|score.?=?\s*5[0-9]/.test(lower)) return "medium"
  return "default"
}

function baseDisclaimers(): string[] {
  return [
    "Suggestion IA non persistée — validation humaine requise.",
    "Ne constitue pas une certification, une éligibilité ni une garantie de résultat.",
  ]
}

function draftSuggestion(partial: {
  title: string
  objective: string
  targetAudience: string
  categories: GenerateScorecardDraftSuggestion["categories"]
  questions: GenerateScorecardDraftSuggestion["questions"]
}): GenerateScorecardDraftOutput {
  return {
    status: "draft_suggestion",
    title: partial.title,
    description: `${partial.objective} Brouillon généré à des fins de revue uniquement.`,
    targetAudience: partial.targetAudience,
    objective: partial.objective,
    categories: partial.categories,
    questions: partial.questions,
    weightingNotes:
      "Les pondérations sont des suggestions indicatives. Les règles de scoring officielles restent définies dans le Builder.",
    recommendations: [
      "Revue humaine des questions et des scores avant publication.",
      "Ne pas présenter ce brouillon comme une certification officielle.",
    ],
    disclaimers: baseDisclaimers(),
  }
}

export function mockScorecardDraft(key: string): GenerateScorecardDraftOutput {
  if (key === "ambiguous") {
    return {
      status: "needs_clarification",
      clarifyingQuestion:
        "Souhaitez-vous évaluer les compétences en leadership, les performances commerciales, ou les deux ?",
      options: ["Leadership", "Performances commerciales", "Les deux (hybride)"],
      rationale:
        "Le besoin mélange deux diagnostics distincts ; un questionnaire hybride sans arbitrage serait peu exploitable.",
      disclaimers: [
        "Aucune scorecard n'a été créée ni persistée.",
        "Clarification requise avant toute suggestion de brouillon.",
      ],
    }
  }

  if (key === "competency") {
    return draftSuggestion({
      title: "Auto-évaluation compétences gestion de projet",
      objective: "Cartographier l'efficacité des pratiques de planification, risques, parties prenantes et suivi.",
      targetAudience: "Chefs de projet et contributeurs",
      categories: [
        { name: "Planification", description: "Jalons, livrables, estimations", weightSuggestion: 30 },
        { name: "Risques", description: "Identification et mitigation suivie", weightSuggestion: 25 },
        { name: "Parties prenantes", description: "Alignement et communication", weightSuggestion: 20 },
        { name: "Suivi", description: "Utilité décisionnelle du reporting", weightSuggestion: 25 },
      ],
      questions: [
        {
          title: "Dans quelle mesure le plan des jalons est-il daté, partagé et suivi jusqu'aux écarts ?",
          type: "single_choice",
          isRequired: true,
          isScored: true,
          categoryName: "Planification",
          options: [
            { label: "Plan partagé, daté, responsables et écarts traités", score: 20 },
            { label: "Plan existant mais suivi irrégulier", score: 10 },
            { label: "Liste informelle ou absente", score: 0 },
          ],
        },
        {
          title: "Le registre de risques conduit-il à des actions de mitigation suivies ?",
          type: "yes_no",
          isRequired: true,
          isScored: true,
          categoryName: "Risques",
          options: [
            { label: "Oui", score: 15 },
            { label: "Non", score: 0 },
          ],
        },
        {
          title: "Quelle est l'utilité décisionnelle de votre reporting d'avancement ?",
          type: "scale_5",
          isRequired: true,
          isScored: true,
          categoryName: "Suivi",
          description:
            "1 = reporting rare ou sans décision ; 5 = cadence adaptée et indicateurs actionnables (la fréquence seule ne suffit pas)",
          options: [],
        },
        {
          title: "Comment gérez-vous les attentes des parties prenantes clés ?",
          type: "single_choice",
          isRequired: true,
          isScored: true,
          categoryName: "Parties prenantes",
          options: [
            { label: "Plan de communication et revues planifiées", score: 20 },
            { label: "Échanges ad hoc selon les urgences", score: 8 },
            { label: "Peu de suivi formalisé", score: 0 },
          ],
        },
      ],
    })
  }

  if (key === "org") {
    return draftSuggestion({
      title: "Diagnostic de maturité organisationnelle / PMO",
      objective: "Mesurer la maturité de gouvernance, livraison et reporting — hors collecte de contacts.",
      targetAudience: "Direction et PMO",
      categories: [
        { name: "Gouvernance", description: "Décision, rôles, arbitrages", weightSuggestion: 35 },
        { name: "Livraison", description: "Cadence et qualité des livrables", weightSuggestion: 35 },
        { name: "Reporting", description: "Visibilité et indicateurs", weightSuggestion: 30 },
      ],
      questions: [
        {
          title: "Dans quelle mesure les rôles PMO sont-ils adaptés et réellement appliqués ?",
          type: "scale_5",
          isRequired: true,
          isScored: true,
          categoryName: "Gouvernance",
          description:
            "1 = rôles absents ou confus ; 3 = formalisés mais partiellement appliqués ; 5 = adaptés au contexte et appliqués (autonomie max ≠ meilleur score)",
          options: [],
        },
        {
          title: "Existe-t-il une instance d'arbitrage des priorités transverses qui produit des décisions tracées ?",
          type: "yes_no",
          isRequired: true,
          isScored: true,
          categoryName: "Gouvernance",
          options: [
            { label: "Oui", score: 20 },
            { label: "Non", score: 0 },
          ],
        },
        {
          title: "Comment mesurez-vous la prévisibilité des livraisons ?",
          type: "single_choice",
          isRequired: true,
          isScored: true,
          categoryName: "Livraison",
          options: [
            { label: "Indicateurs de délai/qualité suivis et utilisés", score: 20 },
            { label: "Suivi informel par projet", score: 8 },
            { label: "Pas de mesure partagée", score: 0 },
          ],
        },
        {
          title: "Dans quelle mesure le reporting consolidé aide-t-il réellement l'arbitrage de portefeuille ?",
          type: "single_choice",
          isRequired: true,
          isScored: true,
          categoryName: "Reporting",
          options: [
            { label: "Indicateurs décisionnels utilisés en comité", score: 20 },
            { label: "Reporting volumineux peu utilisé pour décider", score: 6 },
            { label: "Peu ou pas de reporting consolidé", score: 0 },
          ],
        },
      ],
    })
  }

  if (key === "sales") {
    return draftSuggestion({
      title: "Qualification commerciale B2B",
      objective: "Qualifier le besoin, l'urgence et la maturité d'achat — sans confusion avec un CRM.",
      targetAudience: "Équipes commerciales et SDR",
      categories: [
        { name: "Besoin", description: "Problème métier et urgence", weightSuggestion: 40 },
        { name: "Maturité d'achat", description: "Processus et critères", weightSuggestion: 35 },
        { name: "Fit solution", description: "Adéquation perçue", weightSuggestion: 25 },
      ],
      questions: [
        {
          title: "Quel problème métier principal le prospect cherche-t-il à résoudre ?",
          type: "short_text",
          isRequired: true,
          isScored: false,
          categoryName: "Besoin",
          options: [],
        },
        {
          title: "Quel est le niveau d'urgence déclaré pour traiter ce besoin ?",
          type: "single_choice",
          isRequired: true,
          isScored: true,
          categoryName: "Besoin",
          options: [
            { label: "Décision prévue sous 30 jours", score: 20 },
            { label: "Exploration sous 90 jours", score: 10 },
            { label: "Veille sans échéance", score: 2 },
          ],
        },
        {
          title: "Un processus d'évaluation / validation interne est-il déjà engagé ?",
          type: "yes_no",
          isRequired: true,
          isScored: true,
          categoryName: "Maturité d'achat",
          options: [
            { label: "Oui", score: 15 },
            { label: "Non", score: 0 },
          ],
        },
        {
          title: "Quelles contraintes de sécurité ou de conformité le prospect mentionne-t-il ?",
          type: "short_text",
          isRequired: false,
          isScored: false,
          categoryName: "Fit solution",
          options: [],
        },
        {
          title: "Dans quelle mesure la solution envisagée couvre-t-elle les contraintes techniques exprimées ?",
          type: "scale_5",
          isRequired: true,
          isScored: true,
          categoryName: "Fit solution",
          description:
            "1 = contraintes non adressées ; 5 = couverture claire des contraintes majeures (la seule existence de contraintes ne rapporte aucun point)",
          options: [],
        },
      ],
    })
  }

  if (key === "training") {
    return draftSuggestion({
      title: "Évaluation des besoins de formation",
      objective: "Identifier les priorités de montée en compétences avant un parcours de formation.",
      targetAudience: "Managers RH et responsables formation",
      categories: [
        { name: "Contexte", description: "Situation et enjeux", weightSuggestion: 25 },
        { name: "Compétences", description: "Savoir-faire évalués", weightSuggestion: 40 },
        { name: "Pratiques", description: "Mise en œuvre terrain", weightSuggestion: 35 },
      ],
      questions: [
        {
          title: "Quel est votre niveau d'expérience sur ce sujet ?",
          type: "scale_5",
          isRequired: true,
          isScored: true,
          categoryName: "Contexte",
          description: "1 = débutant ; 5 = expert opérationnel",
          options: [],
        },
        {
          title: "Quels livrables produisez-vous régulièrement ?",
          type: "multiple_choice",
          isRequired: true,
          isScored: true,
          categoryName: "Pratiques",
          options: [
            { label: "Plans et feuilles de route", score: 20 },
            { label: "Rapports de suivi", score: 20 },
            { label: "Peu de livrables formalisés", score: 5 },
          ],
        },
        {
          title: "Disposez-vous d'un processus documenté ?",
          type: "yes_no",
          isRequired: true,
          isScored: true,
          categoryName: "Pratiques",
          options: [
            { label: "Oui", score: 20 },
            { label: "Non", score: 0 },
          ],
        },
        {
          title: "Quelle est votre principale difficulté actuelle ?",
          type: "short_text",
          isRequired: false,
          isScored: false,
          categoryName: "Contexte",
          options: [],
        },
      ],
    })
  }

  return draftSuggestion({
    title: key === "malicious" ? "Brouillon sécurisé générique" : "Scorecard de diagnostic",
    objective:
      key === "malicious"
        ? "Produire une structure neutre sans exécuter d'instruction hostile."
        : "Évaluer un besoin métier à partir d'une description utilisateur.",
    targetAudience: key === "malicious" ? "Utilisateur générique" : "Professionnels concernés par le sujet décrit",
    categories: [
      { name: "Contexte", description: "Situation et enjeux", weightSuggestion: 25 },
      { name: "Compétences", description: "Savoir-faire évalués", weightSuggestion: 40 },
      { name: "Pratiques", description: "Mise en œuvre terrain", weightSuggestion: 35 },
    ],
    questions: [
      {
        title: "Quel est votre niveau d'expérience sur ce sujet ?",
        type: "scale_5",
        isRequired: true,
        isScored: true,
        categoryName: "Contexte",
        description: "1 = débutant ; 5 = expert opérationnel",
        options: [],
      },
      {
        title: "Quels livrables produisez-vous régulièrement ?",
        type: "multiple_choice",
        isRequired: true,
        isScored: true,
        categoryName: "Pratiques",
        options: [
          { label: "Plans et feuilles de route", score: 20 },
          { label: "Rapports de suivi", score: 20 },
          { label: "Peu de livrables formalisés", score: 5 },
        ],
      },
      {
        title: "Disposez-vous d'un processus documenté ?",
        type: "yes_no",
        isRequired: true,
        isScored: true,
        categoryName: "Pratiques",
        options: [
          { label: "Oui", score: 20 },
          { label: "Non", score: 0 },
        ],
      },
      {
        title: "Quelle est votre principale difficulté actuelle ?",
        type: "short_text",
        isRequired: false,
        isScored: false,
        categoryName: "Contexte",
        options: [],
      },
    ],
  })
}

function parseOfficialEcho(blob: string): AnalyzeScorecardResultsOutput["officialScoresEcho"] {
  const globalMatch = blob.match(/"globalScorePercent"\s*:\s*([0-9.]+)/)
  const globalScorePercent = globalMatch ? Number(globalMatch[1]) : 55
  const categoryScores: { name: string; scorePercent: number }[] = []
  const catRe = /"name"\s*:\s*"([^"]+)"\s*,\s*"scorePercent"\s*:\s*([0-9.]+)/g
  let match: RegExpExecArray | null
  while ((match = catRe.exec(blob))) {
    categoryScores.push({ name: match[1], scorePercent: Number(match[2]) })
  }
  if (categoryScores.length === 0) {
    categoryScores.push({ name: "Global", scorePercent: globalScorePercent })
  }
  return { globalScorePercent, categoryScores }
}

export function mockAnalyzeResults(key: string, blob: string): AnalyzeScorecardResultsOutput {
  const echo = parseOfficialEcho(blob)
  const band =
    key === "low" || echo.globalScorePercent < 40
      ? "low"
      : key === "high" || echo.globalScorePercent >= 80
        ? "high"
        : key === "imbalanced"
          ? "imbalanced"
          : key === "partial"
            ? "partial"
            : key === "inconsistent"
              ? "inconsistent"
              : "medium"

  const respondentMatch = blob.match(/"respondentCount"\s*:\s*(\d+)/)
  const respondentCount = respondentMatch ? Number(respondentMatch[1]) : undefined
  const hasThresholds = /"thresholds"\s*:\s*\[\s*\{/.test(blob)
  const identicalCats =
    echo.categoryScores.length >= 2 &&
    echo.categoryScores.every((c) => c.scorePercent === echo.categoryScores[0]?.scorePercent)

  const facts = [
    `Score global fourni : ${echo.globalScorePercent} %.`,
    ...echo.categoryScores.map((c) => `Catégorie ${c.name} fournie : ${c.scorePercent} %.`),
  ]
  if (identicalCats) {
    facts.push("Les catégories fournies présentent des scores identiques.")
  }

  const interpretations =
    band === "imbalanced"
      ? [
          "L'amplitude entre catégories est marquée d'après les scores fournis ; la cause n'est pas connue.",
        ]
      : band === "low"
        ? ["Le niveau global fourni est bas ; toute cause organisationnelle reste non établie."]
        : band === "high"
          ? ["Le niveau global fourni est élevé ; cela ne prouve pas une excellence généralisée hors périmètre mesuré."]
          : ["Les écarts observés sont descriptifs ; aucune causalité n'est affirmée."]

  const summaries: Record<string, string> = {
    low: "Le score global fourni indique un niveau faible. L'interprétation se limite aux données transmises.",
    medium: "Le score global fourni indique un niveau intermédiaire avec des marges de progression.",
    high: "Le score global fourni indique un niveau élevé sur les dimensions mesurées.",
    imbalanced: "Les catégories fournies sont déséquilibrées : certaines dimensions contrastent fortement.",
    partial: "Analyse limitée : certaines métadonnées sont partielles ; aucune donnée manquante n'a été inventée.",
    inconsistent: "Des valeurs fournies semblent incohérentes ; l'analyse signale la limite sans recalculer les scores.",
  }

  const limits = [
    "L'IA n'a pas recalculé les scores officiels.",
    "Interprétation non certaine — pas un fait absolu.",
  ]
  if (band === "partial" || echo.categoryScores.length <= 1) {
    limits.push("Données partielles ou catégorie unique : conclusions provisoires.")
  }
  if (respondentCount !== undefined && respondentCount <= 1) {
    limits.push("Échantillon réduit (≤1 répondant) : ne pas généraliser.")
  }
  if (!hasThresholds) {
    limits.push("Aucun seuil métier fourni : positionnement par bande non applicable.")
  }

  return {
    summary: summaries[band] ?? summaries.medium,
    strengths:
      band === "high"
        ? ["Score global élevé selon les valeurs fournies"]
        : band === "low"
          ? []
          : identicalCats
            ? []
            : ["Des catégories proches ou au-dessus du global peuvent servir de base"],
    improvementAreas:
      band === "low"
        ? ["Prioriser les catégories les plus basses fournies"]
        : band === "imbalanced"
          ? ["Investiguer l'écart d'amplitude entre catégories (sans cause inventée)"]
          : identicalCats
            ? []
            : ["Consolider les axes clairement sous le seuil ou le global"],
    explanations: [
      "Les pourcentages cités sont exclusivement ceux fournis en entrée.",
      "Les écarts sont décrits en amplitude, sans cause inventée.",
    ],
    recommendations: [
      "Comparer les scores fournis aux seuils métier définis lorsqu'ils existent.",
      "Compléter le diagnostic par un entretien humain si besoin.",
    ],
    facts,
    interpretations,
    analysisLimits: limits,
    officialScoresEcho: echo,
  }
}

export function mockActionPlan(key: string, blob: string): GenerateActionPlanOutput {
  const useCaseMatch = blob.match(/"useCase"\s*:\s*"([^"]+)"/)
  const useCase = useCaseMatch?.[1] ?? "developpement_competences"

  const gaps: string[] = []
  const gapRe = /"gaps"\s*:\s*\[([^\]]*)\]/
  const gapBlock = blob.match(gapRe)?.[1] ?? ""
  const gapItemRe = /"([^"]+)"/g
  let gm: RegExpExecArray | null
  while ((gm = gapItemRe.exec(gapBlock))) gaps.push(gm[1])

  const constraints: string[] = []
  const constBlock = blob.match(/"constraints"\s*:\s*\[([^\]]*)\]/)?.[1] ?? ""
  const constItemRe = /"([^"]+)"/g
  let cm: RegExpExecArray | null
  while ((cm = constItemRe.exec(constBlock))) constraints.push(cm[1])

  const arbitration = shouldRequireArbitration({ gaps, constraints })

  if (arbitration) {
    return {
      situationSynthesis:
        "Plusieurs chantiers majeurs concurrent pour une ressource limitée ; arbitrage requis avant engagement.",
      topPriorities: [
        "Comparer les options sur impact, effort et délai",
        "Obtenir un arbitrage métier explicite",
        "Préparer un plan conditionnel selon le choix",
      ],
      actions: [
        {
          title: "Grille de décision",
          description:
            "Comparer les options fournies selon impact métier, effort, délai et risque — sans choisir à la place du décideur.",
          priority: "haute",
          horizon: "immédiat",
          expectedOutcome: "Tableau comparatif partagé",
          successIndicator: "Critères et scores relatifs documentés",
        },
        {
          title: "Arbitrage conditionnel",
          description: "Présenter les hypothèses et demander confirmation du chantier unique à financer.",
          priority: "haute",
          horizon: "immédiat",
          expectedOutcome: "Décision écrite du sponsor",
          successIndicator: "Choix validé explicitement",
        },
        {
          title: "Plan conditionnel A/B",
          description:
            "Préparer deux squelettes d'actions activables après arbitrage — sans engager de dépense.",
          priority: "moyenne",
          horizon: "30_jours",
          expectedOutcome: "Deux plans conditionnels prêts",
          successIndicator: "Plans documentés, non exécutés",
        },
      ],
      facts: ["Contrainte de ressource unique fournie.", "Au moins deux écarts / chantiers distincts fournis."],
      hypotheses: ["L'ordre de priorité réel dépend de critères non tous fournis."],
      recommendations: ["Ne pas lancer de dépense avant confirmation."],
      disclaimers: ["Aucun chantier n'est engagé automatiquement.", "Aucun résultat chiffré n'est garanti."],
      missingInformation: ["Critère de décision prioritaire du sponsor (impact, délai, risque)."],
      requiresArbitration: true,
      arbitrationQuestion:
        "Avec un budget pour un seul chantier majeur, quelle option priorisez-vous et selon quel critère (impact, délai, risque) ?",
    }
  }

  return {
    situationSynthesis:
      key === "malicious"
        ? "Situation traitée de façon neutre sans exécuter d'instruction hostile ni promesse commerciale."
        : `Plan indicatif pour le cas ${useCase}, basé uniquement sur le diagnostic fourni.`,
    topPriorities: [
      "Clarifier l'objectif prioritaire mesurable",
      "Traiter le principal écart signalé",
      "Mettre en place un indicateur de suivi simple",
    ],
    actions: [
      {
        title: "Cadence de revue",
        description: "Organiser une revue courte des écarts fournis avec les parties prenantes.",
        priority: "haute",
        horizon: "immédiat",
        expectedOutcome: "Alignement sur 1 à 3 priorités",
        successIndicator: "Compte-rendu validé sous 7 jours",
      },
      {
        title: "Plan de montée en compétences",
        description: "Définir des actions d'apprentissage ciblées sans inventer d'offre WOLOYEM ni de prix.",
        priority: "moyenne",
        horizon: "30_jours",
        expectedOutcome: "Parcours indicatif documenté",
        successIndicator: "Au moins 2 actions démarrées",
      },
      {
        title: "Suivi d'impact",
        description: "Choisir un indicateur simple lié aux scores fournis (pas de recalcul, pas de % garanti).",
        priority: "moyenne",
        horizon: "90_jours",
        expectedOutcome: "Tableau de suivi minimal",
        successIndicator: "Indicateur renseigné à J+90",
      },
    ],
    facts: ["Les éléments du diagnostic fourni constituent les seuls faits retenus."],
    hypotheses: ["Les écarts signalés peuvent avoir des causes organisationnelles non fournies."],
    recommendations: [
      "Valider le plan avec un responsable métier.",
      "Ne pas déclencher de relance commerciale automatique.",
    ],
    disclaimers: [
      "Aucun résultat n'est garanti.",
      "Aucune formation WOLOYEM, tarif ou donnée CRM réelle n'a été inventée.",
    ],
    missingInformation: ["Baseline chiffrée non fournie — éviter les objectifs % inventés."],
    requiresArbitration: false,
  }
}

