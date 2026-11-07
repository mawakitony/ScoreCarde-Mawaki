# LOT 19T — Dossier de revue métier (réponses LIVE LOT 19N)

**HUMAN REVIEW :** `PENDING`  
**Aucune note ni décision préremplie.**  
**PASS déterministe ≠ validation métier.**  
**Appels LLM dans ce LOT :** aucun.

---

## Sources des réponses réelles (non modifiées)

| Artefact | Rôle |
|----------|------|
| `tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-traces.json` | `validatedOutput` + métriques par scénario |
| `tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-full.json` | Rapport complet |
| `tmp/lot19m-live/lot19m-validations.json` | Verdicts déterministes 19M |
| `docs/ai/lot19n-live-final-results.md` | Synthèse exécution LIVE |

Ouvrir le `validatedOutput` du scénario dans `traces.json` (recherche `scenarioId`) pour la **réponse JSON intégrale**.

### Versions — ne pas confondre

| Pattern | Version des réponses LIVE 19N | Version code actuelle (après 19T) |
|---------|-------------------------------|-----------------------------------|
| Draft | **1.3.1** | 1.3.1 |
| Analyze | **1.3.0** | 1.3.0 |
| Plan (C1, C2) | **1.3.1** | **1.3.3** |
| Plan (C4) | 1.3.1 — **échec Zod, pas de sortie** | 1.3.3 (contrat MOCK seulement) |

Une décision `OK` sur une réponse Plan **1.3.1** n’approuve **pas** le Plan **1.3.3**.

---

## Grille de notation (1–5)

| Note | Signification |
|------|----------------|
| 1 | Inacceptable |
| 2 | Faible — réécriture lourde |
| 3 | Acceptable avec corrections notables |
| 4 | Bon — corrections mineures |
| 5 | Excellent pour le périmètre |

**Critères :** pertinence · absence de biais PMP/PMO/B2B · clarté · respect des contraintes · fiabilité des interprétations · absence de promesses trompeuses · absence de fausse affiliation PMI · respect des scores officiels · qualité des arbitrages · utilité WOLOYEM.

**Décision :** `OK` | `REWORK` | `REJECT` — laisser vide jusqu’à revue réelle.

---

## Vue d’ensemble

| Code | ID | Version LIVE | Validateur 19N | Réponse disponible | Décision |
|------|-----|--------------|----------------|--------------------|----------|
| A1 | `d19m_draft_pmp` | draft 1.3.1 | DETERMINISTIC_FAIL (lexical PMI — corrigé offline 19R/S) | Oui | PENDING |
| A2 | `d19m_draft_pmo` | draft 1.3.1 | HUMAN_REVIEW_REQUIRED | Oui | PENDING |
| A3 | `d19m_draft_prospects` | draft 1.3.1 | HUMAN_REVIEW_REQUIRED | Oui | PENDING |
| A4 | `d19m_draft_ambiguous` | draft 1.3.1 | DETERMINISTIC_PASS | Oui | PENDING |
| B2 | `d19m_analyze_high` | analyze 1.3.0 | HUMAN_REVIEW_REQUIRED | Oui | PENDING |
| C1 | `d19m_plan_skills` | plan **1.3.1** | HUMAN_REVIEW_REQUIRED | Oui | PENDING |
| C2 | `d19m_plan_pmo` | plan **1.3.1** | HUMAN_REVIEW_REQUIRED | Oui | PENDING |
| C4 | `d19m_plan_competing` | plan 1.3.1 | DETERMINISTIC_FAIL (Zod) | **Non** | PENDING |

---

## A1 — `d19m_draft_pmp`

1. **Identifiant :** `d19m_draft_pmp`  
2. **Demande initiale :** Créer une scorecard d'auto-évaluation des pratiques de gestion de projet inspirées du référentiel PMP, sans prétendre à une certification officielle PMI.  
3. **Réponse LIVE :** `traces.json` → entrée `d19m_draft_pmp` → `validatedOutput` (status `draft_suggestion`, titre « Auto‑évaluation des pratiques… (inspiré du référentiel PMP) », disclaimers anti-PMI présents).  
4. **Version Pattern :** draft **1.3.1**  
5. **Validateur déterministe 19N :** FAIL lexical PMI (faux positif sur négation) — **corrigé hors ligne** ; replay A1 **VERIFIED** en 19S/19T. Qualité anti-biais **non** auto-validée.  
6. **Points métier à examiner :** questions « fréquence » / « automatisation du reporting » scorées ; pertinence vs efficacité des pratiques ; absence de fausse affiliation PMI.  
7. **Risques :** biais fréquence/outil ; confusion certification.  
8. **Décision humaine :** PENDING  
9. **Commentaires responsable :** _à compléter_

| Critère (1–5) | Note | Commentaire |
|---------------|------|-------------|
| Pertinence | | |
| Absence de biais | | |
| Clarté | | |
| Respect contraintes / anti-PMI | | |
| Utilité WOLOYEM | | |
| **Décision** OK / REWORK / REJECT | | |

---

## A2 — `d19m_draft_pmo`

1. **Identifiant :** `d19m_draft_pmo`  
2. **Demande :** Diagnostic de maturité PMO pour une direction de projets fictive de 40 personnes (gouvernance, livraison, reporting).  
3. **Réponse LIVE :** `traces.json` → `d19m_draft_pmo` → `validatedOutput` (titre « Diagnostic de maturité PMO – Direction de projets (40 personnes) »).  
4. **Version :** draft **1.3.1**  
5. **Validateur :** HUMAN_REVIEW_REQUIRED (déterministe OK)  
6. **Points :** gouvernance / décisions / utilité reporting ; pas d’autonomie-max / automatisation comme proxy de maturité.  
7. **Risques :** biais outil/autonomie.  
8. **Décision :** PENDING  
9. **Commentaires :** _à compléter_

| Critère (1–5) | Note | Commentaire |
|---------------|------|-------------|
| Pertinence | | |
| Absence de biais | | |
| Clarté | | |
| Respect contraintes | | |
| Utilité WOLOYEM | | |
| **Décision** | | |

---

## A3 — `d19m_draft_prospects`

1. **Identifiant :** `d19m_draft_prospects`  
2. **Demande :** Scorecard qualification prospects B2B mid-market — besoin, urgence, maturité d'achat, adéquation — **sans** collecte d'e-mail.  
3. **Réponse LIVE :** `traces.json` → `d19m_draft_prospects` → `validatedOutput`.  
4. **Version :** draft **1.3.1**  
5. **Validateur :** HUMAN_REVIEW_REQUIRED  
6. **Points :** contraintes ≠ points positifs ; pas de champs contact ; questions métier exploitables.  
7. **Risques :** questions hors sujet / contact.  
8. **Décision :** PENDING  
9. **Commentaires :** _à compléter_

| Critère (1–5) | Note | Commentaire |
|---------------|------|-------------|
| Pertinence | | |
| Absence de biais | | |
| Clarté | | |
| Respect « pas d’e-mail » | | |
| Utilité WOLOYEM | | |
| **Décision** | | |

---

## A4 — `d19m_draft_ambiguous`

1. **Identifiant :** `d19m_draft_ambiguous`  
2. **Demande :** « Je voudrais quelque chose sur le leadership ou les ventes. »  
3. **Réponse LIVE :** status `needs_clarification` ; question du type leadership / commercial / les deux (voir `clarifyingQuestion` dans traces).  
4. **Version :** draft **1.3.1**  
5. **Validateur :** DETERMINISTIC_PASS  
6. **Points :** clarification sans inventer de scorecard.  
7. **Risques :** faible si clarification claire.  
8. **Décision :** PENDING  
9. **Commentaires :** _à compléter_

| Critère (1–5) | Note | Commentaire |
|---------------|------|-------------|
| Pertinence de la clarification | | |
| Clarté | | |
| **Décision** | | |

---

## B2 — `d19m_analyze_high`

1. **Identifiant :** `d19m_analyze_high`  
2. **Demande / scores officiels :** global **88** ; Outils **92** ; Collaboration **85** ; Sécurité **87**.  
3. **Réponse LIVE :** `traces.json` → `officialScoresEcho` doit refléter exactement ces scores.  
4. **Version :** analyze **1.3.0**  
5. **Validateur :** HUMAN_REVIEW_REQUIRED ; scoring integrity PASS déterministe.  
6. **Points :** faits vs interprétations ; prudence ; pas de recalcul.  
7. **Risques :** sur-interprétation.  
8. **Décision :** PENDING  
9. **Commentaires :** _à compléter_

| Critère (1–5) | Note | Commentaire |
|---------------|------|-------------|
| Respect scores officiels | | |
| Fiabilité interprétations | | |
| Prudence | | |
| Utilité WOLOYEM | | |
| **Décision** | | |

---

## C1 — `d19m_plan_skills`

1. **Identifiant :** `d19m_plan_skills`  
2. **Demande :** diagnostic compétences ; contraintes « Budget formation **limité** », « 3h/semaine ».  
3. **Réponse LIVE :** `traces.json` → `requiresArbitration=false` (conforme attente C1).  
4. **Version Pattern ayant produit la réponse :** plan **1.3.1** (**pas** 1.3.3).  
5. **Validateur :** HUMAN_REVIEW_REQUIRED  
6. **Points :** réalisme charge 3h/semaine ; pas d’arbitrage injustifié ; actions concrètes.  
7. **Risques :** plan irréaliste / arbitrage forcé.  
8. **Décision :** PENDING  
9. **Commentaires :** _à compléter_

| Critère (1–5) | Note | Commentaire |
|---------------|------|-------------|
| Respect contraintes | | |
| Qualité arbitrage (doit être absent) | | |
| Utilité | | |
| **Décision** | | |

---

## C2 — `d19m_plan_pmo`

1. **Identifiant :** `d19m_plan_pmo`  
2. **Demande :** PMO reporting ; « Pas de nouvel outil cette année » ; équipe 3.  
3. **Réponse LIVE :** `traces.json` → `requiresArbitration=false` ; examiner actions (ex. macros Excel / Power Query mentionnées en 19N).  
4. **Version :** plan **1.3.1** (**pas** 1.3.3).  
5. **Validateur :** HUMAN_REVIEW_REQUIRED  
6. **Points :** nouvel outil vs Excel existant ; % « à valider » ; utilité indicateurs.  
7. **Risques :** contournement contrainte outil.  
8. **Décision :** PENDING  
9. **Commentaires :** _à compléter_

| Critère (1–5) | Note | Commentaire |
|---------------|------|-------------|
| Respect « pas de nouvel outil » | | |
| Clarté / utilité | | |
| **Décision** | | |

---

## C4 — `d19m_plan_competing` (cas particulier)

1. **Identifiant :** `d19m_plan_competing`  
2. **Demande :** budget **unique** / un seul chantier majeur ; délai 90 jours ; plusieurs écarts concurrents.  
3. **Réponse LIVE réelle :** **indisponible** — `runOk=false`, `errorCode=output_invalid`, pas de `validatedOutput`, corps brut LLM **non persisté**.  
4. **Version tentée en 19N :** plan **1.3.1**  
5. **Validateur 19N :** DETERMINISTIC_FAIL (Zod)  
6. **Points métier :** non évaluables sur ce run.  
7. **Risques :** arbitrage exclusif non prouvé en LIVE.  
8. **Décision humaine :** PENDING  
9. **Commentaires :** _à compléter_

**État technique (ne pas inventer de contenu C4) :**

| Élément | Statut |
|---------|--------|
| LIVE 19N | Zod FAIL |
| Réponse brute | indisponible |
| Cause exacte Zod | non déterminée |
| Contrat Plan v1.3.3 | vérifié hors ligne (MOCK) |
| Nouveau résultat Groq | non disponible |
| Retest LIVE ciblé | **nécessaire après autorisation** |

| Critère (1–5) | Note | Commentaire |
|---------------|------|-------------|
| Qualité arbitrage | N/A — pas de sortie | |
| **Décision** | PENDING | |

---

## Synthèse pour le responsable

- **7** réponses LIVE documentées et lisibles dans les artefacts.  
- **1** scénario (C4) **sans** réponse métier.  
- Aucune case `OK` / `REWORK` / `REJECT` n’est préremplie.  
- Après revue : reporter les décisions dans `docs/ai/lot19t-go-no-go-checklist.md`.
