# LOT 19K — Package de revue métier finale (Patterns v1.3.0)

**HUMAN REVIEW :** **PENDING**

**TECHNICAL PASS (LOT 19J) ≠ APPROVED.** Aucune note humaine n'est préremplie. Aucun statut APPROVED n'est attribué.

**Source LIVE :** `lot19j-v130-retest-2026-10-25T05-58-59-331Z-full.json`

**Campagne :** `lot19j-v130-retest`

**LIVE LLM CALLS (ce LOT) :** **ZERO** — préparation de revue uniquement.

**PRODUCTION CHANGES :** **NONE**

---

## Mode d'emploi

1. Lire l'entrée synthétique complète.
2. Lire la **réponse Groq intégrale** (JSON) sans se fier aux seuls contrôles techniques.
3. Noter les **10 critères** de 0 à 5 (ancrages ci-dessous).
4. Lister tout défaut bloquant.
5. Décision humaine : `OK` / `REWORK` / `REJECT` — **ne pas utiliser APPROVED automatiquement**.

### Scénarios à mettre en évidence

| ID | Focus |
|----|-------|
| `d19j_draft_pmp` (A1) | Pertinence questions / échelles |
| `d19j_draft_pmo` (A2) | Anti-contact / maturité PMO |
| `d19j_draft_prospects` (A3) | Qualification B2B |
| `d19j_analyze_high` (B2) | Petits écarts / sur-interprétation |
| `d19j_plan_skills` (C1) | Arbitrage prudent non exigé ; qualité du plan |

### Les 10 critères (LOT 19H / rubric partagée)

- **pertinence** — La réponse adresse réellement le besoin métier décrit (0=hors sujet, 5=parfaitement ciblé).
- **precision** — Informations exactes et concrètes, sans remplissage vague (0=faux/vague, 5=précis).
- **coherence_metier** — Cohérence avec les pratiques WOLOYEM / métier (0=contradictoire, 5=solide).
- **clarte** — Formulation claire et lisible (0=incompréhensible, 5=très clair).
- **utilite_recommandations** — Recommandations actionnables, non génériques (0=inutiles, 5=immédiatement exploitables).
- **respect_donnees** — Respect strict des données d'entrée / scores officiels (déterministe possible).
- **absence_inventions** — Pas de faits, certifications ou chiffres inventés (0=hallucinations, 5=prudent).
- **qualite_structure** — Structure JSON / sections attendues (en grande partie déterministe via Zod + checks).
- **adaptation_contexte** — Adaptation au public, locale, contraintes et cas d'usage.
- **exploitabilite_woloyem** — Prêt à être utilisé dans Builder / analyse / rapports après revue humaine.

### Ancrages de note

- **0** — Inutilisable / dangereux / hors contrat
- **1** — Très faible — erreurs majeures
- **2** — Faible — utilisable seulement après réécriture lourde
- **3** — Acceptable — nécessite corrections notables
- **4** — Bon — corrections mineures
- **5** — Excellent — prêt revue produit légère

### Totaux techniques LOT 19J (rappel)

| | |
|--|--|
| Version Patterns | **1.3.0** |
| TECHNICAL | 12 PASS / 0 FAIL / 0 NOT RUN |
| HTTP | 12 / 18 |
| Coût estimé | $0.012203 / $0.02 |
| Zod | 12/12 |
| Scoring integrity | 4/4 |

---

## Fiche 1 — `d19j_draft_pmp`

> **PRIORITÉ REVUE — A1 (pertinence questions / échelles)**

| | |
|--|--|
| Pattern | Génération de scorecard (`generate_scorecard_draft`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1484 / 2156 / 0 |
| Latence | 5736 ms |
| Coût estimé scénario | $0.001516 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "locale": "fr",
  "maxQuestions": 12,
  "maxCategories": 4,
  "description": "Créer une scorecard d'auto-évaluation des pratiques de gestion de projet inspirées du référentiel PMP, sans prétendre à une certification officielle PMI."
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=5736 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `draft_status` | PASS | status=draft_suggestion |
| `no_forbidden_substrings` | PASS | clean |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "status": "draft_suggestion",
  "title": "Auto-évaluation des pratiques de gestion de projet – Référentiel PMP (brouillon)",
  "description": "Brouillon pour évaluer l'application des bonnes pratiques PMP en planification, gestion des risques, suivi et parties prenantes — hors certification officielle.",
  "targetAudience": "Chefs de projet, PMO et membres d’équipes projet",
  "objective": "Identifier les forces et les axes d’amélioration des pratiques de gestion de projet afin de guider un plan de développement individuel.",
  "categories": [
    {
      "name": "Planification",
      "description": "Définition des jalons, livrables et mise à jour du plan",
      "weightSuggestion": 30
    },
    {
      "name": "Gestion des Risques",
      "description": "Identification, évaluation et suivi des risques",
      "weightSuggestion": 25
    },
    {
      "name": "Suivi et Reporting",
      "description": "Indicateurs de performance, rapports d’avancement et revues formelles",
      "weightSuggestion": 25
    },
    {
      "name": "Gestion des Parties Prenantes",
      "description": "Identification, attentes et engagement des parties prenantes",
      "weightSuggestion": 20
    }
  ],
  "questions": [
    {
      "title": "Comment définissez-vous les jalons et les livrables du projet ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Planification",
      "options": [
        {
          "label": "Plan détaillé avec dates, responsabilités et critères d'acceptation",
          "score": 20
        },
        {
          "label": "Plan sommaire avec dates clés",
          "score": 10
        },
        {
          "label": "Liste informelle sans dates précises",
          "score": 0
        }
      ]
    },
    {
      "title": "À quelle fréquence mettez-vous à jour le plan de projet ?",
      "description": "1 = jamais ; 5 = au moins hebdomadaire",
      "type": "scale_5",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Planification",
      "options": []
    },
    {
      "title": "Utilisez-vous un outil de gestion de projet pour suivre les tâches ?",
      "type": "yes_no",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Planification",
      "options": [
        {
          "label": "Oui",
          "score": 10
        },
        {
          "label": "Non",
          "score": 0
        }
      ]
    },
    {
      "title": "Disposez-vous d'un registre de risques régulièrement revu ?",
      "type": "yes_no",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Gestion des Risques",
      "options": [
        {
          "label": "Oui",
          "score": 15
        },
        {
          "label": "Non",
          "score": 0
        }
      ]
    },
    {
      "title": "Comment évaluez-vous la probabilité et l’impact des risques ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Gestion des Risques",
      "options": [
        {
          "label": "Matrice détaillée avec scores",
          "score": 15
        },
        {
          "label": "Évaluation qualitative simple",
          "score": 8
        },
        {
          "label": "Pas d’évaluation formelle",
          "score": 0
        }
      ]
    },
    {
      "title": "À quelle fréquence les actions de mitigation sont‑elles mises à jour ?",
      "description": "1 = jamais ; 5 = à chaque revue de risque",
      "type": "scale_5",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Gestion des Risques",
      "options": []
    },
    {
      "title": "Quel est le niveau de visibilité des indicateurs de performance (KPIs) pour les parties prenantes ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Suivi et Reporting",
      "options": [
        {
          "label": "Tableau de bord partagé en temps réel",
          "score": 20
        },
        {
          "label": "Rapports mensuels",
          "score": 10
        },
        {
          "label": "Pas de KPI formel",
          "score": 0
        }
      ]
    },
    {
      "title": "À quelle fréquence publiez‑vous un rapport d’avancement ?",
      "description": "1 = rarement ; 5 = chaque semaine",
      "type": "scale_5",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Suivi et Reporting",
      "options": []
    },
    {
      "title": "Utilisez‑vous des revues d’avancement formelles (ex. réunions de pilotage) ?",
      "type": "yes_no",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Suivi et Reporting",
      "options": [
        {
          "label": "Oui",
          "score": 10
        },
        {
          "label": "Non",
          "score": 0
        }
      ]
    },
    {
      "title": "Comment identifiez‑vous les parties prenantes et leurs attentes ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Gestion des Parties Prenantes",
      "options": [
        {
          "label": "Analyse formelle (RACI, cartographie)",
          "score": 15
        },
        {
          "label": "Liste informelle",
          "score": 5
        },
        {
          "label": "Pas d’identification claire",
          "score": 0
        }
      ]
    },
    {
      "title": "Quel est le niveau d’engagement des parties prenantes clés ?",
      "description": "1 = aucun engagement ; 10 = engagement fort et proactif",
      "type": "scale_10",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Gestion des Parties Prenantes",
      "options": []
    },
    {
      "title": "Quel est votre principal défi actuel avec les parties prenantes ?",
      "type": "short_text",
      "isRequired": false,
      "isScored": false,
      "categoryName": "Gestion des Parties Prenantes",
      "options": []
    }
  ],
  "weightingNotes": "Pondérations indicatives (~100 au total). À ajuster selon les priorités de l’organisation.",
  "recommendations": [
    "Faire relire les questions par un pair métier avant publication.",
    "Valider les scores et les seuils de maturité avec les parties prenantes clés."
  ],
  "disclaimers": [
    "Suggestion IA non persistée.",
    "Ne constitue pas une certification PMI ni une validation officielle d’organisme.",
    "Validation humaine requise avant publication."
  ]
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 2 — `d19j_draft_pmo`

> **PRIORITÉ REVUE — A2 (anti-contact / maturité PMO)**

| | |
|--|--|
| Pattern | Génération de scorecard (`generate_scorecard_draft`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1480 / 1990 / 1024 |
| Latence | 34170 ms |
| Coût estimé scénario | $0.001339 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "locale": "fr",
  "maxQuestions": 12,
  "maxCategories": 4,
  "description": "Diagnostic de maturité PMO pour une direction de projets fictive de 40 personnes (gouvernance, livraison, reporting)."
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=34170 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `draft_status` | PASS | status=draft_suggestion |
| `no_forbidden_substrings` | PASS | clean |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "status": "draft_suggestion",
  "title": "Diagnostic de maturité PMO – gouvernance, livraison et reporting",
  "description": "Brouillon pour évaluer le niveau de maturité du PMO d’une direction de projets de 40 personnes, en se concentrant sur la gouvernance, la livraison et le reporting. Aucun usage de certification officielle.",
  "targetAudience": "Responsables PMO, chefs de projet senior et membres de la direction de projets",
  "objective": "Identifier les forces et les axes d’amélioration du PMO afin de prioriser les actions de montée en maturité.",
  "categories": [
    {
      "name": "Gouvernance",
      "description": "Structures de décision, priorisation et conformité aux standards",
      "weightSuggestion": 35
    },
    {
      "name": "Livraison",
      "description": "Gestion des délais, budgets et changements",
      "weightSuggestion": 35
    },
    {
      "name": "Reporting",
      "description": "Visibilité, automatisation et pertinence des indicateurs",
      "weightSuggestion": 30
    }
  ],
  "questions": [
    {
      "title": "Quel niveau d’autonomie accordez-vous aux équipes projet pour définir leurs propres processus ?",
      "description": "1 = aucune autonomie ; 5 = pleine autonomie",
      "type": "scale_5",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Gouvernance",
      "options": []
    },
    {
      "title": "Disposez-vous d’un comité de gouvernance PMO avec des revues périodiques ?",
      "type": "yes_no",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Gouvernance",
      "options": [
        {
          "label": "Oui",
          "score": 20
        },
        {
          "label": "Non",
          "score": 0
        }
      ]
    },
    {
      "title": "Comment formalisez-vous les critères de priorisation des projets ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Gouvernance",
      "options": [
        {
          "label": "Matrice de priorisation validée par la direction",
          "score": 20
        },
        {
          "label": "Critères informels",
          "score": 8
        },
        {
          "label": "Pas de critères définis",
          "score": 0
        }
      ]
    },
    {
      "title": "Quel est le taux de conformité des projets aux standards PMO ?",
      "description": "1 = <20 % de conformité ; 10 = 100 % de conformité",
      "type": "scale_10",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Gouvernance",
      "options": []
    },
    {
      "title": "Quel est le pourcentage moyen de projets livrés à temps ?",
      "description": "1 = <20 % à temps ; 10 = 100 % à temps",
      "type": "scale_10",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Livraison",
      "options": []
    },
    {
      "title": "Utilisez-vous une méthode standardisée de gestion des changements ?",
      "type": "yes_no",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Livraison",
      "options": [
        {
          "label": "Oui",
          "score": 15
        },
        {
          "label": "Non",
          "score": 0
        }
      ]
    },
    {
      "title": "Comment évaluez-vous la capacité de votre équipe à respecter le budget ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Livraison",
      "options": [
        {
          "label": "Suivi budgétaire détaillé et alertes",
          "score": 20
        },
        {
          "label": "Suivi budgétaire sommaire",
          "score": 8
        },
        {
          "label": "Pas de suivi budgétaire",
          "score": 0
        }
      ]
    },
    {
      "title": "Fréquence des revues de performance des projets ?",
      "description": "1 = jamais ; 5 = hebdomadaire",
      "type": "scale_5",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Livraison",
      "options": []
    },
    {
      "title": "Quel niveau de visibilité avez-vous sur les indicateurs clés (KPIs) du portefeuille ?",
      "description": "1 = aucune visibilité ; 5 = visibilité en temps réel",
      "type": "scale_5",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Reporting",
      "options": []
    },
    {
      "title": "Les rapports de statut sont-ils automatisés ?",
      "type": "yes_no",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Reporting",
      "options": [
        {
          "label": "Oui",
          "score": 15
        },
        {
          "label": "Non",
          "score": 0
        }
      ]
    },
    {
      "title": "Quel est le délai moyen de production du reporting mensuel ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Reporting",
      "options": [
        {
          "label": "Moins de 2 jours",
          "score": 20
        },
        {
          "label": "2‑5 jours",
          "score": 12
        },
        {
          "label": "Plus de 5 jours",
          "score": 0
        }
      ]
    },
    {
      "title": "Quel est le principal obstacle à un reporting efficace ?",
      "type": "short_text",
      "isRequired": false,
      "isScored": false,
      "categoryName": "Reporting",
      "options": []
    }
  ],
  "weightingNotes": "Pondérations indicatives (~100 au total). À ajuster selon les priorités de la direction.",
  "recommendations": [
    "Faire valider les questions par un responsable PMO avant diffusion.",
    "Adapter les échelles aux pratiques internes si besoin."
  ],
  "disclaimers": [
    "Suggestion IA non persistée.",
    "Ne constitue pas une certification officielle ni une validation d’organisme externe.",
    "Validation humaine requise avant publication."
  ]
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 3 — `d19j_draft_prospects`

> **PRIORITÉ REVUE — A3 (qualification B2B sans confusion CRM)**

| | |
|--|--|
| Pattern | Génération de scorecard (`generate_scorecard_draft`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1487 / 1351 / 0 |
| Latence | 30965 ms |
| Coût estimé scénario | $0.001034 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "locale": "fr",
  "maxQuestions": 12,
  "maxCategories": 4,
  "description": "Scorecard de qualification de prospects B2B mid-market fictifs : besoin métier, urgence, maturité d'achat et adéquation solution — sans collecte d'e-mail."
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=30965 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `draft_status` | PASS | status=draft_suggestion |
| `no_forbidden_substrings` | PASS | clean |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "status": "draft_suggestion",
  "title": "Scorecard de qualification prospects B2B mid-market",
  "description": "Brouillon pour évaluer besoin métier, urgence, maturité d'achat et adéquation solution d'un prospect — sans collecte d'e-mail.",
  "targetAudience": "Responsables commerciaux, équipes de développement business, managers de comptes",
  "objective": "Identifier les prospects à fort potentiel et prioriser les actions commerciales.",
  "categories": [
    {
      "name": "Besoin métier",
      "description": "Pertinence du besoin exprimé par le prospect",
      "weightSuggestion": 25
    },
    {
      "name": "Urgence",
      "description": "Temporalité du besoin et pression du marché",
      "weightSuggestion": 25
    },
    {
      "name": "Maturité d'achat",
      "description": "Niveau de préparation du prospect à acheter",
      "weightSuggestion": 25
    },
    {
      "name": "Adéquation solution",
      "description": "Correspondance entre l'offre et les exigences du prospect",
      "weightSuggestion": 25
    }
  ],
  "questions": [
    {
      "title": "Quel problème métier le prospect cherche-t-il à résoudre ?",
      "type": "short_text",
      "isRequired": true,
      "isScored": false,
      "categoryName": "Besoin métier",
      "options": []
    },
    {
      "title": "Dans quelle mesure le besoin est-il critique pour le prospect ?",
      "description": "1 = peu critique, 5 = extrêmement critique",
      "type": "scale_5",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Besoin métier",
      "options": []
    },
    {
      "title": "Le prospect a-t-il déjà alloué un budget pour ce besoin ?",
      "type": "yes_no",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Urgence",
      "options": [
        {
          "label": "Oui",
          "score": 15
        },
        {
          "label": "Non",
          "score": 0
        }
      ]
    },
    {
      "title": "Quel est le délai prévu pour la mise en œuvre de la solution ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Urgence",
      "options": [
        {
          "label": "Moins de 3 mois",
          "score": 20
        },
        {
          "label": "3 à 6 mois",
          "score": 12
        },
        {
          "label": "Plus de 6 mois",
          "score": 5
        }
      ]
    },
    {
      "title": "Le prospect a-t-il déjà évalué des fournisseurs similaires ?",
      "type": "yes_no",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Maturité d'achat",
      "options": [
        {
          "label": "Oui",
          "score": 15
        },
        {
          "label": "Non",
          "score": 0
        }
      ]
    },
    {
      "title": "Quel est le niveau de décision du contact interrogé ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Maturité d'achat",
      "options": [
        {
          "label": "Décideur final",
          "score": 20
        },
        {
          "label": "Influenceur",
          "score": 12
        },
        {
          "label": "Utilisateur",
          "score": 5
        }
      ]
    },
    {
      "title": "Dans quelle mesure votre solution répond-elle aux exigences fonctionnelles du prospect ?",
      "description": "1 = très faible adéquation, 10 = très forte adéquation",
      "type": "scale_10",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Adéquation solution",
      "options": []
    },
    {
      "title": "Quel est le niveau d'intégration technique requis par le prospect ?",
      "type": "single_choice",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Adéquation solution",
      "options": [
        {
          "label": "Intégration simple (API standard)",
          "score": 20
        },
        {
          "label": "Intégration moyenne (customisation)",
          "score": 12
        },
        {
          "label": "Intégration complexe (développement lourd)",
          "score": 5
        }
      ]
    },
    {
      "title": "Le prospect a-t-il exprimé des contraintes de conformité ou de sécurité spécifiques ?",
      "type": "yes_no",
      "isRequired": true,
      "isScored": true,
      "categoryName": "Adéquation solution",
      "options": [
        {
          "label": "Oui",
          "score": 10
        },
        {
          "label": "Non",
          "score": 0
        }
      ]
    },
    {
      "title": "Quel est le principal frein perçu par le prospect à l'adoption de votre solution ?",
      "type": "short_text",
      "isRequired": false,
      "isScored": false,
      "categoryName": "Adéquation solution",
      "options": []
    }
  ],
  "weightingNotes": "Pondérations indicatives (~100 au total). Ajuster selon priorités business.",
  "recommendations": [
    "Faire valider le questionnaire par l'équipe commerciale avant diffusion.",
    "Tester le scorecard sur un panel pilote de prospects pour affiner les scores."
  ],
  "disclaimers": [
    "Suggestion IA non persistée.",
    "Ne constitue pas une certification officielle ni une validation d'organisme tiers.",
    "Validation humaine requise avant publication."
  ]
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 4 — `d19j_draft_ambiguous`

| | |
|--|--|
| Pattern | Génération de scorecard (`generate_scorecard_draft`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1464 / 401 / 0 |
| Latence | 24222 ms |
| Coût estimé scénario | $0.00046 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "locale": "fr",
  "maxQuestions": 12,
  "maxCategories": 4,
  "description": "Je voudrais quelque chose sur le leadership ou les ventes."
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=24222 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `clarification_status` | PASS | status=needs_clarification; question=present |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "status": "needs_clarification",
  "clarifyingQuestion": "Souhaitez-vous que la scorecard porte sur le leadership, les ventes, ou les deux ?",
  "options": [
    "Leadership",
    "Ventes",
    "Les deux (hybride)"
  ],
  "rationale": "Le besoin mentionne deux domaines distincts sans indiquer de priorité ; un questionnaire hybride serait arbitraire.",
  "disclaimers": [
    "Aucune scorecard n'a été créée ni persistée.",
    "Clarification requise avant toute suggestion de brouillon."
  ]
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 5 — `d19j_analyze_low`

| | |
|--|--|
| Pattern | Analyse des résultats (`analyze_scorecard_results`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1063 / 1052 / 0 |
| Latence | 18370 ms |
| Coût estimé scénario | $0.000791 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "scorecardName": "Maturité PMO (synthétique)",
  "objective": "Mesurer la maturité PMO",
  "globalScorePercent": 27,
  "categoryScores": [
    {
      "name": "Gouvernance",
      "scorePercent": 18
    },
    {
      "name": "Livraison",
      "scorePercent": 32
    },
    {
      "name": "Reporting",
      "scorePercent": 30
    }
  ],
  "thresholds": [
    {
      "label": "Faible",
      "minPercent": 0,
      "maxPercent": 39
    }
  ],
  "allowedMetadata": {
    "language": "fr",
    "respondentCount": 1,
    "notes": "échantillon synthétique faible"
  }
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=18370 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `scoring_integrity` | PASS | echo matches input |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "summary": "Avec un score global de 27 %, le profil se situe dans la bande Faible (0–39 %).",
  "strengths": [
    "Livraison (32 %) est au-dessus du score global."
  ],
  "improvementAreas": [
    "Gouvernance (18 %) est nettement en dessous du score global."
  ],
  "explanations": [
    "Les pourcentages cités (global 27 %, Gouvernance 18 %, Livraison 32 %, Reporting 30 %) proviennent exclusivement des données d’entrée fournies.",
    "Aucune cause organisationnelle n’est affirmée faute de données supplémentaires."
  ],
  "recommendations": [
    "Examiner les pratiques de gouvernance pour identifier des leviers d’amélioration.",
    "Comparer chaque catégorie aux seuils métier fournis avant toute décision."
  ],
  "facts": [
    "Score global fourni : 27 %.",
    "Catégorie Gouvernance fournie : 18 %.",
    "Catégorie Livraison fournie : 32 %.",
    "Catégorie Reporting fournie : 30 %.",
    "Seuil \"Faible\" : 0–39 %."
  ],
  "interpretations": [
    "Livraison dépasse le global de +5 points, indiquant une relative force modestement supérieure.",
    "Reporting dépasse le global de +3 points, différence modeste.",
    "Gouvernance est inférieure au global de -9 points, signalant une faiblesse notable."
  ],
  "analysisLimits": [
    "Échantillon synthétique très limité (1 répondant).",
    "Absence de métadonnées supplémentaires empêche d’établir des causes précises."
  ],
  "officialScoresEcho": {
    "globalScorePercent": 27,
    "categoryScores": [
      {
        "name": "Gouvernance",
        "scorePercent": 18
      },
      {
        "name": "Livraison",
        "scorePercent": 32
      },
      {
        "name": "Reporting",
        "scorePercent": 30
      }
    ]
  }
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 6 — `d19j_analyze_high`

> **PRIORITÉ REVUE — B2 (petits écarts / sur-interprétation)**

| | |
|--|--|
| Pattern | Analyse des résultats (`analyze_scorecard_results`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1062 / 1191 / 768 |
| Latence | 20936 ms |
| Coût estimé scénario | $0.000816 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "scorecardName": "Compétences digitales (synthétique)",
  "objective": "Cartographier les compétences numériques",
  "globalScorePercent": 88,
  "categoryScores": [
    {
      "name": "Outils",
      "scorePercent": 92
    },
    {
      "name": "Collaboration",
      "scorePercent": 85
    },
    {
      "name": "Sécurité",
      "scorePercent": 87
    }
  ],
  "thresholds": [
    {
      "label": "Élevé",
      "minPercent": 75,
      "maxPercent": 100
    }
  ],
  "allowedMetadata": {
    "language": "fr",
    "respondentCount": 1,
    "notes": "échantillon synthétique élevé"
  }
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=20936 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `scoring_integrity` | PASS | echo matches input |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "summary": "Avec un score global de 88 %, le profil se situe dans la bande Élevé (75–100 %).",
  "strengths": [
    "La catégorie Outils (92 %) est au‑dessus du score global (+4 pts)."
  ],
  "improvementAreas": [],
  "explanations": [
    "Les pourcentages cités (global 88 %, Outils 92 %, Collaboration 85 %, Sécurité 87 %) proviennent exclusivement des données d’entrée.",
    "Aucune cause n’est déduite, le texte se limite aux constats observables."
  ],
  "recommendations": [
    "Surveiller les écarts modestes entre les catégories et le score global avant d’envisager des actions ciblées."
  ],
  "facts": [
    "Score global fourni : 88 %.",
    "Catégorie Outils fournie : 92 %.",
    "Catégorie Collaboration fournie : 85 %.",
    "Catégorie Sécurité fournie : 87 %."
  ],
  "interpretations": [
    "L’écart Outils vs global (+4 pts) indique une force relative.",
    "Les écarts Collaboration (‑3 pts) et Sécurité (‑1 pt) sont modestes et restent dans la même bande de seuil.",
    "Toutes les catégories sont au‑dessus du seuil Élevé (≥75 %)."
  ],
  "analysisLimits": [
    "Échantillon synthétique avec un seul répondant limite la robustesse des conclusions.",
    "Aucun contexte supplémentaire n’est fourni (ex. objectifs détaillés, historique)."
  ],
  "officialScoresEcho": {
    "globalScorePercent": 88,
    "categoryScores": [
      {
        "name": "Outils",
        "scorePercent": 92
      },
      {
        "name": "Collaboration",
        "scorePercent": 85
      },
      {
        "name": "Sécurité",
        "scorePercent": 87
      }
    ]
  }
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 7 — `d19j_analyze_imbalanced`

| | |
|--|--|
| Pattern | Analyse des résultats (`analyze_scorecard_results`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1059 / 923 / 0 |
| Latence | 21032 ms |
| Coût estimé scénario | $0.000713 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "scorecardName": "Leadership de proximité (synthétique)",
  "objective": "Évaluer les pratiques de leadership",
  "globalScorePercent": 54,
  "categoryScores": [
    {
      "name": "Communication",
      "scorePercent": 95
    },
    {
      "name": "Délégation",
      "scorePercent": 20
    },
    {
      "name": "Feedback",
      "scorePercent": 48
    }
  ],
  "thresholds": [
    {
      "label": "Intermédiaire",
      "minPercent": 40,
      "maxPercent": 74
    }
  ],
  "allowedMetadata": {
    "language": "fr",
    "respondentCount": 3,
    "notes": "déséquilibre synthétique"
  }
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=21032 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `scoring_integrity` | PASS | echo matches input |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "summary": "Avec un score global de 54 %, le profil se situe dans la bande Intermédiaire (40–74 %).",
  "strengths": [
    "La catégorie Communication (95 %) est nettement au‑dessus du score global."
  ],
  "improvementAreas": [
    "La catégorie Délégation (20 %) est nettement en dessous du score global.",
    "La catégorie Feedback (48 %) est en dessous du score global."
  ],
  "explanations": [
    "Les pourcentages cités (global 54 %, Communication 95 %, Délégation 20 %, Feedback 48 %) proviennent exclusivement des données d’entrée fournies.",
    "Aucune cause n’est avancée, car aucune information supplémentaire n’est disponible."
  ],
  "recommendations": [
    "Analyser les pratiques de délégation afin d’identifier des leviers d’amélioration.",
    "Comparer chaque catégorie aux seuils métier avant toute décision d’action.",
    "Envisager d’augmenter le nombre de répondants pour renforcer la fiabilité des scores."
  ],
  "facts": [
    "Score global fourni : 54 %.",
    "Catégorie Communication fournie : 95 %.",
    "Catégorie Délégation fournie : 20 %.",
    "Catégorie Feedback fournie : 48 %."
  ],
  "interpretations": [
    "L’écart Communication vs global est de +41 pts, indiquant une force relative.",
    "L’écart Délégation vs global est de -34 pts, indiquant une faiblesse notable.",
    "L’écart Feedback vs global est de -6 pts, indiquant une performance inférieure au global mais moins marquée."
  ],
  "analysisLimits": [
    "Échantillon limité à 3 répondants ; les conclusions restent prudentes.",
    "Les données sont synthétiques et ne permettent pas d’identifier les causes sous‑jacentes."
  ],
  "officialScoresEcho": {
    "globalScorePercent": 54,
    "categoryScores": [
      {
        "name": "Communication",
        "scorePercent": 95
      },
      {
        "name": "Délégation",
        "scorePercent": 20
      },
      {
        "name": "Feedback",
        "scorePercent": 48
      }
    ]
  }
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 8 — `d19j_analyze_partial`

| | |
|--|--|
| Pattern | Analyse des résultats (`analyze_scorecard_results`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1021 / 726 / 0 |
| Latence | 18326 ms |
| Coût estimé scénario | $0.000589 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "scorecardName": "Diagnostic partiel (synthétique)",
  "objective": "Interpréter un résultat incomplet",
  "globalScorePercent": 61,
  "categoryScores": [
    {
      "name": "Processus",
      "scorePercent": 61
    }
  ],
  "thresholds": [],
  "allowedMetadata": {
    "language": "fr",
    "respondentCount": 1,
    "notes": "partiel"
  }
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=18326 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `scoring_integrity` | PASS | echo matches input |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "summary": "Le score global est de 61 % ; la seule catégorie fournie, Processus, a également 61 %.",
  "strengths": [],
  "improvementAreas": [],
  "explanations": [
    "Les pourcentages cités (global 61 %, Processus 61 %) proviennent exclusivement des données d'entrée.",
    "Aucun recalcul n'a été effectué."
  ],
  "recommendations": [
    "Collecter les scores des autres catégories et les seuils associés pour une analyse plus complète."
  ],
  "facts": [
    "Score global fourni : 61 %.",
    "Catégorie Processus fournie : 61 %."
  ],
  "interpretations": [
    "L'égalité entre le score global et la catégorie Processus indique aucune différence observable."
  ],
  "analysisLimits": [
    "Données partielles : une seule catégorie disponible.",
    "Absence de seuils de référence.",
    "Échantillon très limité (respondentCount = 1)."
  ],
  "officialScoresEcho": {
    "globalScorePercent": 61,
    "categoryScores": [
      {
        "name": "Processus",
        "scorePercent": 61
      }
    ]
  }
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 9 — `d19j_plan_skills`

> **PRIORITÉ REVUE — C1 (requiresArbitration prudent non exigé + qualité du plan)**

| | |
|--|--|
| Pattern | Plan d'action (`generate_action_plan`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1823 / 1461 / 0 |
| Latence | 18120 ms |
| Coût estimé scénario | $0.00115 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "locale": "fr",
  "strengths": [
    "Bases techniques correctes",
    "Motivation individuelle"
  ],
  "gaps": [
    "Gestion des risques peu structurée",
    "Communication parties prenantes irrégulière",
    "Planification des jalons peu formalisée"
  ],
  "constraints": [
    "Budget formation limité",
    "Disponibilité 3h/semaine"
  ],
  "situationSummary": "Diagnostic synthétique d'une équipe projet fictive : lacunes en gestion des risques, communication parties prenantes irrégulière et planification des jalons peu formalisée. Bases techniques correctes.",
  "useCase": "developpement_competences"
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=18120 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `three_priorities` | PASS | topPriorities.length=3 |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "situationSynthesis": "Équipe projet avec bases techniques solides et motivation individuelle, mais lacunes identifiées en gestion des risques, communication irrégulière avec les parties prenantes et planification des jalons peu formalisée. Contraintes : budget formation limité et disponibilité de 3 h/semaine pour les actions d'amélioration.",
  "topPriorities": [
    "Structurer la gestion des risques",
    "Régulariser la communication avec les parties prenantes",
    "Formaliser la planification des jalons"
  ],
  "actions": [
    {
      "title": "Atelier de structuration de la gestion des risques",
      "description": "Organiser un atelier de 2 h (sur deux sessions de 1 h) pour définir un registre des risques, les critères d'évaluation et les responsabilités, en s'appuyant sur les modèles internes existants.",
      "priority": "haute",
      "horizon": "30_jours",
      "expectedOutcome": "Registre des risques opérationnel et procédure d'actualisation documentée",
      "successIndicator": "Document de registre des risques signé par le chef de projet avant J+30"
    },
    {
      "title": "Mise en place d'un tableau de suivi de la communication",
      "description": "Créer un tableau partagé (ex. Google Sheet) listant les parties prenantes, fréquence de contact, canal privilégié et points clés à communiquer. Prévoir une mise à jour hebdomadaire de 30 min.",
      "priority": "haute",
      "horizon": "immédiat",
      "expectedOutcome": "Visibilité claire des échanges et cadence de communication définie",
      "successIndicator": "Tableau partagé accessible à tous les membres et première mise à jour réalisée d'ici J+14"
    },
    {
      "title": "Standardisation de la planification des jalons",
      "description": "Développer un modèle de planning (ex. Gantt simplifié) incluant les jalons clés, les livrables associés et les dates de revue. Réserver 1 h/semaine pendant 4 semaines pour le remplir et le valider avec le sponsor.",
      "priority": "moyenne",
      "horizon": "90_jours",
      "expectedOutcome": "Planning de projet formalisé et partagé avec les parties prenantes",
      "successIndicator": "Modèle de planning validé et diffusé avant J+90"
    },
    {
      "title": "Session de revue des actions et ajustements",
      "description": "Organiser une réunion de 1 h à J+60 pour vérifier l'adoption des outils créés, recueillir les retours et ajuster les processus si besoin.",
      "priority": "basse",
      "horizon": "6_mois",
      "expectedOutcome": "Plan d'amélioration continue actualisé",
      "successIndicator": "Compte‑rendu de revue avec actions correctives listées d'ici J+60"
    }
  ],
  "facts": [
    "Forces : bases techniques correctes, motivation individuelle.",
    "Écarts fournis : gestion des risques peu structurée, communication irrégulière, planification des jalons peu formalisée.",
    "Contraintes explicites : budget formation limité, disponibilité 3 h/semaine."
  ],
  "hypotheses": [
    "Le budget limité ne permet pas de financer des formations externes ou des consultants.",
    "Les parties prenantes disposent d'outils de collaboration déjà en place (ex. suite bureautique)."
  ],
  "recommendations": [
    "Valider chaque livrable avec le sponsor avant de passer à l'étape suivante.",
    "Prioriser les actions en fonction du critère métier le plus impactant (risque, communication ou planning)."
  ],
  "disclaimers": [
    "Aucun résultat n'est garanti.",
    "Aucune offre, prix ou formation WOLOYEM n'est proposé."
  ],
  "missingInformation": [
    "Montant exact du budget disponible pour la formation ou les outils.",
    "Liste précise des parties prenantes et leurs attentes.",
    "Existence éventuelle d'un cadre de gestion des risques déjà partiellement déployé."
  ],
  "requiresArbitration": true,
  "arbitrationQuestion": "Le budget formation limité ne permet pas de financer les trois chantiers simultanément. Parmi les trois écarts (gestion des risques, communication, planification des jalons), lequel doit être priorisé en premier, et selon quel critère (impact métier, délai de mise en œuvre, risque) ?"
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 10 — `d19j_plan_pmo`

| | |
|--|--|
| Pattern | Plan d'action (`generate_action_plan`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1826 / 1686 / 0 |
| Latence | 30102 ms |
| Coût estimé scénario | $0.001285 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "locale": "fr",
  "strengths": [
    "Discipline de reporting établie",
    "Sponsor direction présent"
  ],
  "gaps": [
    "Indicateurs peu orientés décision",
    "Priorisation de portefeuille floue",
    "Temps passé en reporting au détriment de l'arbitrage"
  ],
  "constraints": [
    "Pas de nouvel outil cette année",
    "Équipe PMO de 3 personnes"
  ],
  "situationSummary": "Organisation fictive dont le PMO produit un volume élevé de reporting opérationnel mais manque d'indicateurs utiles à l'arbitrage et à la priorisation du portefeuille.",
  "useCase": "maturite_organisationnelle"
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=30102 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `three_priorities` | PASS | topPriorities.length=3 |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "situationSynthesis": "Le PMO produit un volume important de reporting opérationnel mais les indicateurs ne soutiennent pas l'arbitrage ni la priorisation du portefeuille. Le sponsor direction est présent et la discipline de reporting est établie, mais l'équipe ne peut pas acquérir de nouvel outil et ne compte que 3 personnes.",
  "topPriorities": [
    "Définir des indicateurs décisionnels utiles à l'arbitrage",
    "Instaurer un processus de priorisation du portefeuille",
    "Optimiser le temps consacré au reporting pour libérer du temps d'arbitrage"
  ],
  "actions": [
    {
      "title": "Co-construction d’un tableau de bord décisionnel",
      "description": "Organiser un atelier de 2 h avec le sponsor et les responsables métiers pour sélectionner 3 à 5 KPI directement exploités dans les décisions d’arbitrage, puis formaliser le tableau de bord dans un fichier partagé.",
      "priority": "haute",
      "horizon": "immédiat",
      "expectedOutcome": "KPI décisionnels définis, documentés et validés par le sponsor",
      "successIndicator": "Document de KPI signé et diffusé sous 10 jours calendaires"
    },
    {
      "title": "Mise en place d’un processus de priorisation du portefeuille",
      "description": "Appliquer une matrice valeur/effort sur l’ensemble des projets du portefeuille, en s’appuyant sur les KPI définis, et valider la liste priorisée lors du comité de pilotage.",
      "priority": "haute",
      "horizon": "30_jours",
      "expectedOutcome": "Liste de projets priorisée et partagée avec les parties prenantes",
      "successIndicator": "Feuille de priorisation validée par le comité de pilotage à J+30"
    },
    {
      "title": "Analyse et rationalisation du reporting actuel",
      "description": "Cartographier les rapports existants, identifier les redondances et les données déjà disponibles dans les systèmes sources, puis créer des modèles Excel/macros pour automatiser les extractions récurrentes.",
      "priority": "moyenne",
      "horizon": "30_jours",
      "expectedOutcome": "Temps moyen de production de reporting mesuré avant et après optimisation",
      "successIndicator": "Réduction observée du temps de génération de reporting (cible indicative à valider avec l’équipe) d’au moins 20 % à J+30"
    },
    {
      "title": "Session de formation interne à l’interprétation des KPI",
      "description": "Animer une formation de 2 h pour les 3 membres du PMO afin d’assurer une lecture cohérente des nouveaux KPI et leur utilisation dans les revues de portefeuille.",
      "priority": "basse",
      "horizon": "90_jours",
      "expectedOutcome": "Équipe capable d’interpréter et d’expliquer les KPI aux décideurs",
      "successIndicator": "Questionnaire de compréhension rempli avec un score ≥ 80 % à J+90"
    }
  ],
  "facts": [
    "Force : discipline de reporting établie",
    "Force : sponsor direction présent",
    "Écart : indicateurs peu orientés décision",
    "Écart : priorisation de portefeuille floue",
    "Écart : temps passé en reporting au détriment de l'arbitrage",
    "Contrainte : aucun nouvel outil prévu cette année",
    "Contrainte : équipe PMO de 3 personnes"
  ],
  "hypotheses": [
    "Les équipes métiers ne disposent pas d’un référentiel partagé de KPI utiles",
    "Le processus actuel de priorisation repose sur des critères informels",
    "Une partie du temps de reporting est consacrée à la collecte manuelle de données déjà disponibles"
  ],
  "recommendations": [
    "Valider chaque livrable (KPI, matrice, modèle) avec le sponsor avant diffusion",
    "Planifier les ateliers en fonction de la disponibilité de l’équipe de 3 personnes pour éviter la surcharge"
  ],
  "disclaimers": [
    "Aucun résultat n’est garanti",
    "Aucune offre, prix ou formation WOLOYEM n’est mentionnée"
  ],
  "missingInformation": [
    "Baseline chiffrée du temps moyen de production de reporting actuel",
    "Liste exhaustive des projets du portefeuille à prioriser",
    "Critères de décision prioritaires du sponsor (ex. ROI, alignement stratégique, risque)"
  ],
  "requiresArbitration": false
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 11 — `d19j_plan_digital`

| | |
|--|--|
| Pattern | Plan d'action (`generate_action_plan`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1824 / 1400 / 0 |
| Latence | 31198 ms |
| Coût estimé scénario | $0.001114 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "locale": "fr",
  "strengths": [
    "Sponsor digital identifié",
    "Quelques équipes déjà à l'aise avec les outils"
  ],
  "gaps": [
    "Adoption inégale des outils",
    "Coordination inter-équipes insuffisante",
    "Manque de rituels de suivi communs"
  ],
  "constraints": [
    "Pas de recrutement IT immédiat",
    "Changement progressif exigé"
  ],
  "situationSummary": "Organisation fictive en transformation digitale : adoption inégale des outils collaboratifs et coordination inter-équipes insuffisante, malgré un sponsor digital identifié.",
  "useCase": "maturite_organisationnelle"
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=31198 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `three_priorities` | PASS | topPriorities.length=3 |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "situationSynthesis": "Organisation en transformation digitale avec un sponsor identifié, adoption inégale des outils collaboratifs et coordination inter‑équipes insuffisante, absence de rituels de suivi communs. Pas de recrutement IT immédiat, changement progressif exigé.",
  "topPriorities": [
    "Uniformiser l'adoption des outils collaboratifs",
    "Renforcer la coordination inter‑équipes",
    "Instaurer des rituels de suivi communs"
  ],
  "actions": [
    {
      "title": "Atelier de co‑construction de rituels de suivi",
      "description": "Organiser, avec les équipes pilotes, un atelier de 2 h pour définir un rituel hebdomadaire (ex. stand‑up inter‑équipes) incluant les outils à utiliser et les livrables attendus.",
      "priority": "haute",
      "horizon": "immédiat",
      "expectedOutcome": "Rituel documenté et validé par les équipes pilotes",
      "successIndicator": "Compte‑rendu d'atelier signé par les participants sous 5 jours"
    },
    {
      "title": "Programme de champions d'outils",
      "description": "Sélectionner, parmi les équipes déjà à l'aise, 2 à 3 référents par outil collaboratif ; les former en interne et les charger de soutenir leurs pairs pendant 30 jours.",
      "priority": "moyenne",
      "horizon": "30_jours",
      "expectedOutcome": "Liste de champions active et plan de soutien opérationnel",
      "successIndicator": "Nomination officielle et planning d'accompagnement diffusés d'ici J+30"
    },
    {
      "title": "Tableau de bord d'adoption partagé",
      "description": "Créer, sur l'outil de reporting existant, un tableau de bord affichant le taux d'usage (sessions, documents partagés) par équipe, mis à jour automatiquement chaque semaine.",
      "priority": "moyenne",
      "horizon": "90_jours",
      "expectedOutcome": "Visibilité hebdomadaire de l'adoption pour le sponsor et les managers",
      "successIndicator": "Tableau de bord accessible et mis à jour à J+90"
    },
    {
      "title": "Rituel de revue inter‑équipes mensuel",
      "description": "Instaurer une réunion mensuelle de 45 minutes où chaque équipe présente ses bonnes pratiques et ses difficultés d'usage des outils, animée par le sponsor digital.",
      "priority": "basse",
      "horizon": "6_mois",
      "expectedOutcome": "Échanges structurés et recueil d'actions d'amélioration",
      "successIndicator": "Ordre du jour et compte‑rendu archivés pour 3 réunions consécutives"
    }
  ],
  "facts": [
    "Sponsor digital identifié",
    "Quelques équipes déjà à l'aise avec les outils",
    "Adoption inégale des outils",
    "Coordination inter‑équipes insuffisante",
    "Manque de rituels de suivi communs"
  ],
  "hypotheses": [
    "Les équipes perçoivent les outils comme additionnels à leur charge de travail",
    "L'absence de référents freine le partage de bonnes pratiques",
    "Le manque de visibilité sur les bénéfices attendus limite l'engagement"
  ],
  "recommendations": [
    "Valider le plan d'actions avec le sponsor digital avant lancement",
    "Impliquer les équipes pilotes dès la phase d'atelier",
    "Mesurer l'adoption via les logs d'outil plutôt que par auto‑déclaration"
  ],
  "disclaimers": [
    "Aucun résultat n'est garanti",
    "Aucun pourcentage prévisionnel n'est présenté",
    "Aucune offre ou prix n'est proposé"
  ],
  "missingInformation": [
    "Taux actuel d'adoption par équipe (sessions, documents partagés)",
    "Liste exhaustive des outils collaboratifs en usage",
    "Calendrier des réunions existantes entre équipes",
    "Capacité interne disponible pour former les champions"
  ],
  "requiresArbitration": false
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Fiche 12 — `d19j_plan_competing`

| | |
|--|--|
| Pattern | Plan d'action (`generate_action_plan`) |
| Version testée LIVE | **1.3.0** |
| Modèle | openai/gpt-oss-120b |
| TECHNICAL (19J) | **PASS** |
| Zod / structure | PASS |
| HTTP attempts | 1 |
| Tokens (in/out/cached) | 1817 / 1873 / 0 |
| Latence | 30265 ms |
| Coût estimé scénario | $0.001396 |
| HUMAN REVIEW | **PENDING** |

### Entrée synthétique complète

```json
{
  "locale": "fr",
  "strengths": [
    "Équipe motivée",
    "Process de base documentés"
  ],
  "gaps": [
    "Satisfaction client en baisse",
    "Coûts opérationnels élevés",
    "Compétences critiques concentrées sur peu de personnes"
  ],
  "constraints": [
    "Budget unique pour un seul chantier majeur",
    "Délai 90 jours"
  ],
  "situationSummary": "Organisation fictive aux ressources limitées confrontée simultanément à une baisse de satisfaction client, des coûts opérationnels élevés et une concentration des compétences critiques — sans arbitrage fourni.",
  "useCase": "performance_equipe"
}
```

### Contrôles techniques déterministes

| Check | Pass | Détail |
|-------|------|--------|
| `latency_recorded` | PASS | latencyMs=30265 |
| `json_ok` | PASS | structured result present |
| `zod_ok` | PASS | runner validated output schema |
| `three_priorities` | PASS | topPriorities.length=3 |
| `arbitration_required` | PASS | requiresArbitration=true; question=present |
| `no_side_effect_keys` | PASS | clean |
| `constraints_ok` | PASS | runner constraints applied (mechanical) |

**Anomalies extras 19J :** aucune

### Réponse Groq intégrale (sans reformulation)

```json
{
  "situationSynthesis": "Organisation fictive aux ressources limitées confrontée simultanément à une baisse de satisfaction client, des coûts opérationnels élevés et une concentration des compétences critiques, avec un budget unique pour un seul chantier majeur et un délai de 90 jours.",
  "topPriorities": [
    "Définir les critères d'arbitrage pour choisir le chantier prioritaire",
    "Collecter les données de base permettant de mesurer chaque écart",
    "Préparer des plans d'action conditionnels pour chaque écart"
  ],
  "actions": [
    {
      "title": "Grille d'arbitrage",
      "description": "Construire une matrice comparant les trois écarts (satisfaction, coûts, compétences) selon impact métier, effort, délai et risque, puis la faire valider par le sponsor.",
      "priority": "haute",
      "horizon": "immédiat",
      "expectedOutcome": "Matrice de décision documentée",
      "successIndicator": "Document partagé et signé par le sponsor sous 5 jours"
    },
    {
      "title": "Collecte de données de base",
      "description": "Rassembler les indicateurs actuels : score de satisfaction client, ventilation détaillée des coûts opérationnels, inventaire des compétences critiques et répartition par personne.",
      "priority": "haute",
      "horizon": "30_jours",
      "expectedOutcome": "Baseline chiffrée pour chaque écart",
      "successIndicator": "Tableau de bord initial complété à J+30"
    },
    {
      "title": "Plan d'action conditionnel – Satisfaction client",
      "description": "Définir les actions concrètes (ex. lancement d’enquête NPS, revue du processus de support, mise en place d’un tableau de bord suivi) avec jalons et responsabilités.",
      "priority": "moyenne",
      "horizon": "90_jours",
      "expectedOutcome": "Plan détaillé prêt à être déclenché",
      "successIndicator": "Document de plan validé à J+90"
    },
    {
      "title": "Plan d'action conditionnel – Réduction des coûts opérationnels",
      "description": "Élaborer un plan incluant analyse des processus, identification d’automatisations ciblées et négociation fournisseurs, avec échéancier.",
      "priority": "moyenne",
      "horizon": "90_jours",
      "expectedOutcome": "Plan détaillé prêt à être déclenché",
      "successIndicator": "Document de plan validé à J+90"
    },
    {
      "title": "Plan d'action conditionnel – Diffusion des compétences critiques",
      "description": "Concevoir un programme de formation croisée, création de documentation standardisée et mise en place de binômes pour réduire la dépendance à quelques personnes.",
      "priority": "moyenne",
      "horizon": "90_jours",
      "expectedOutcome": "Plan détaillé prêt à être déclenché",
      "successIndicator": "Document de plan validé à J+90"
    }
  ],
  "facts": [
    "Forces : équipe motivée, processus de base documentés.",
    "Écarts : satisfaction client en baisse, coûts opérationnels élevés, compétences critiques concentrées.",
    "Contraintes : budget unique pour un seul chantier majeur, délai de 90 jours."
  ],
  "hypotheses": [
    "Les causes profondes de chaque écart (ex. problèmes de qualité, redondances de tâches, manque de partage de connaissances) ne sont pas encore identifiées."
  ],
  "recommendations": [
    "Valider la matrice d'arbitrage avec le sponsor avant de lancer le chantier choisi.",
    "Une fois le chantier sélectionné, activer le plan d'action conditionnel correspondant."
  ],
  "disclaimers": [
    "Aucun résultat n'est garanti.",
    "Aucune offre, prix ou formation WOLOYEM n'est proposé."
  ],
  "missingInformation": [
    "Valeur actuelle du score de satisfaction client (ex. NPS ou indice similaire).",
    "Ventilation détaillée des coûts opérationnels par processus ou fonction.",
    "Liste exhaustive des compétences critiques et répartition actuelle.",
    "Critère de décision prioritaire du sponsor (impact métier, délai, risque)."
  ],
  "requiresArbitration": true,
  "arbitrationQuestion": "Le budget ne permet de financer qu'un seul chantier majeur parmi les trois écarts identifiés (satisfaction client, coûts opérationnels, compétences critiques). Lequel souhaitez‑vous prioriser, et selon quel critère principal (impact métier, délai de mise en œuvre, risque) ?"
}
```

### Grille de notation métier (vierge — 10 critères LOT 19H)

| Critère | Note |
|---------|------|
| Pertinence (`pertinence`) (0-5) |  |
| Précision (`precision`) (0-5) |  |
| Cohérence métier (`coherence_metier`) (0-5) |  |
| Clarté (`clarte`) (0-5) |  |
| Utilité des recommandations (`utilite_recommandations`) (0-5) |  |
| Respect des données (`respect_donnees`) (0-5) |  |
| Absence d'inventions (`absence_inventions`) (0-5) |  |
| Qualité de structure (`qualite_structure`) (0-5) |  |
| Adaptation au contexte (`adaptation_contexte`) (0-5) |  |
| Exploitabilité WOLOYEM (`exploitabilite_woloyem`) (0-5) |  |

**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_

### Zone décision humaine

| Champ | Valeur |
|-------|--------|
| Défauts bloquants |  |
| Commentaires |  |
| Reviewer ID |  |
| Date de revue |  |
| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |
| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |

---

## Synthèse package

| Item | Statut |
|------|--------|
| 12 fiches avec entrée + réponse intégrale | Prêt |
| Grilles 10 critères | Vierges |
| Notes humaines | **Aucune** |
| HUMAN REVIEW | **PENDING** |
| APPROVED auto | **Aucun** |
| LIVE calls LOT 19K | **ZERO** |
| LOT 20 | **Non démarré** |

_Fin du package LOT 19K._
