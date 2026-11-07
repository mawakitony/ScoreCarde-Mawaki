# LOT 19P — Dossier de validation métier humaine (Patterns Fabric)

**Statut :** `HUMAN REVIEW: PENDING`  
**Public :** responsable WOLOYEM (non développeur)  
**Appels LLM dans ce LOT :** **aucun**  
**Approbation automatique :** **aucune**

---

## À lire avant de commencer

### Ce que vous examinez

Trois assistants spécialisés (« Patterns ») proposent des **brouillons** :

1. **Génération de scorecard** — questions pour évaluer un besoin (ex. maturité PMO).  
2. **Analyse de résultats** — lecture des scores déjà calculés par WOLOYEM.  
3. **Plan d’action** — priorités et actions à partir d’un diagnostic.

### Versions importantes

| Pattern | Version des réponses de ce dossier (historique LIVE 19J) | Version actuelle du code |
|---------|----------------------------------------------------------|---------------------------|
| Génération de scorecard | **1.3.0** | **1.3.1** (corrigée après 19L) |
| Analyse | **1.3.0** | **1.3.0** (inchangée) |
| Plan d’action | **1.3.0** | **1.3.1** (corrigée après 19L) |

Une note `OK` sur une réponse **historique 1.3.0** ne signifie **pas** que les versions **1.3.1** sont approuvées. Un retest LIVE dédié (LOT 19M) reste nécessaire pour les correctifs draft/plan.

### Où sont les réponses complètes (non modifiées)

| Document | Rôle |
|----------|------|
| [`lot19p-annex-index.md`](./lot19p-annex-index.md) | Index des 12 fiches |
| [`lot19k-business-review-package.md`](./lot19k-business-review-package.md) | **Réponse JSON intégrale** de chaque scénario |
| `tmp/lot19j-live/lot19j-v130-retest-2026-10-25T05-58-59-331Z-full.json` | Artefact technique LIVE d’origine |
| [`lot19p-human-decision-sheet.md`](./lot19p-human-decision-sheet.md) | Fiche de décision globale à signer |

Dans chaque scénario ci-dessous, la section **« Réponse historique complète »** indique la fiche exacte à ouvrir. Le JSON n’a **pas** été réécrit ici pour éviter toute altération.

### Comment noter (1 à 5)

| Note | Signification |
|------|----------------|
| 1 | Inacceptable / dangereux pour le métier |
| 2 | Faible — réécriture lourde nécessaire |
| 3 | Acceptable avec corrections notables |
| 4 | Bon — corrections mineures |
| 5 | Excellent pour le périmètre examiné |

### Les 10 critères

1. **Pertinence métier** — La réponse traite le vrai besoin.  
2. **Compréhension du contexte** — Contraintes et public bien pris en compte.  
3. **Exactitude et cohérence** — Pas de contradiction interne.  
4. **Absence de biais** — Pas de « raccourci » trompeur (ex. outil = maturité).  
5. **Respect des contraintes** — Budget, délais, interdictions respectés.  
6. **Clarté de la réponse** — Lisible sans jargon inutile.  
7. **Utilité opérationnelle** — Actionnable dans WOLOYEM / le terrain.  
8. **Prudence des affirmations** — Pas de garanties inventées.  
9. **Fiabilité des scores et interprétations** — Scores officiels respectés ; faits ≠ opinions.  
10. **Sécurité et confidentialité** — Pas de collecte abusive, pas d’effet de bord.

### Décisions possibles

| Code | Signification |
|------|----------------|
| `OK` | Acceptable pour **cette** réponse historique |
| `REWORK` | Corrections nécessaires (préciser lesquelles) |
| `REJECT` | Inacceptable |

Un score élevé **ne crée pas** automatiquement un `OK`.

---

## Vue d’ensemble des 12 scénarios

| Code | Sujet | ID historique | Réponse complète |
|------|-------|---------------|------------------|
| A1 | Scorecard PMP | `d19j_draft_pmp` | 19K Fiche 1 |
| A2 | Scorecard PMO | `d19j_draft_pmo` | 19K Fiche 2 |
| A3 | Qualification B2B | `d19j_draft_prospects` | 19K Fiche 3 |
| A4 | Demande ambiguë | `d19j_draft_ambiguous` | 19K Fiche 4 |
| B1 | Analyse score faible | `d19j_analyze_low` | 19K Fiche 5 |
| B2 | Analyse score élevé | `d19j_analyze_high` | 19K Fiche 6 |
| B3 | Résultats déséquilibrés | `d19j_analyze_imbalanced` | 19K Fiche 7 |
| B4 | Données partielles | `d19j_analyze_partial` | 19K Fiche 8 |
| C1 | Plan compétences | `d19j_plan_skills` | 19K Fiche 9 |
| C2 | Plan PMO | `d19j_plan_pmo` | 19K Fiche 10 |
| C3 | Plan digital | `d19j_plan_digital` | 19K Fiche 11 |
| C4 | Arbitrage concurrent | `d19j_plan_competing` | 19K Fiche 12 |

---

# Groupe A — Génération de scorecards

---

## A1 — PMP (pratiques de gestion de projet)

### 1. Contexte

Besoin d’une scorecard d’auto-évaluation inspirée du référentiel PMP, **sans** prétendre à une certification officielle PMI.

### 2. Données d’entrée (synthétiques)

> « Créer une scorecard d’auto-évaluation des pratiques de gestion de projet inspirées du référentiel PMP, sans prétendre à une certification officielle PMI. »  
> Limites : 12 questions max, 4 catégories max, français.

### 3. Version du Pattern

**generate_scorecard_draft v1.3.0** (historique LIVE)

### 4. Réponse historique complète

**Annexe intacte :** [`lot19k-business-review-package.md`](./lot19k-business-review-package.md) — **Fiche 1** (`d19j_draft_pmp`), section « Réponse Groq intégrale ».

### 5. Résumé lisible

Le système propose un brouillon intitulé environ « Auto-évaluation des pratiques de gestion de projet – Référentiel PMP », avec 4 catégories (Planification, Risques, Suivi/Reporting, Parties prenantes) et une série de questions scorées. Les disclaimers indiquent qu’il ne s’agit pas d’une certification officielle.

### 6. Points positifs observables

- Objectif d’auto-évaluation clairement posé.  
- Mention explicite « hors certification officielle » dans la description / disclaimers.  
- Structure catégories / questions lisible.

### 7. Problèmes potentiels (à confirmer en lecture)

- Questions du type **« À quelle fréquence… »** (mise à jour du plan, reporting) scorées comme si **plus fréquent = mieux**.  
- Question **oui/non « Utilisez-vous un outil… »** avec score positif pour « Oui » — risque de confondre **possession d’outil** et **maturité**.  
- Correctif documenté ensuite en LOT 19L (version 1.3.1) — **non prouvé en LIVE** sur cette fiche.

### 8. Questions de contrôle

- [ ] Les questions mesurent-elles des compétences / résultats réels ?  
- [ ] Le modèle récompense-t-il excessivement les outils ?  
- [ ] Le modèle récompense-t-il excessivement la fréquence de reporting ?  
- [ ] Cohérence avec l’objectif du scorecard ?  
- [ ] Absence de fausse reconnaissance PMI ?

### 9. Grille de notation (à remplir)

| # | Critère | Note (1–5) | Justification |
|---|---------|------------|---------------|
| 1 | Pertinence métier |  |  |
| 2 | Compréhension du contexte |  |  |
| 3 | Exactitude et cohérence |  |  |
| 4 | Absence de biais |  |  |
| 5 | Respect des contraintes |  |  |
| 6 | Clarté |  |  |
| 7 | Utilité opérationnelle |  |  |
| 8 | Prudence des affirmations |  |  |
| 9 | Fiabilité scores / interprétations |  |  |
| 10 | Sécurité et confidentialité |  |  |
| | **Total / 50** |  |  |

### 10. Commentaires et décision humaine

| Champ | Valeur |
|-------|--------|
| Commentaires du relecteur |  |
| Problèmes bloquants |  |
| Décision (`OK` / `REWORK` / `REJECT`) |  |
| Reviewer / date |  |

---

## A2 — PMO (maturité)

### 1. Contexte

Diagnostic de maturité PMO pour une direction de projets fictive (~40 personnes) : gouvernance, livraison, reporting.

### 2. Données d’entrée

> « Diagnostic de maturité PMO pour une direction de projets fictive de 40 personnes (gouvernance, livraison, reporting). »

### 3. Version

**generate_scorecard_draft v1.3.0**

### 4. Réponse historique complète

**Annexe :** 19K **Fiche 2** (`d19j_draft_pmo`).

### 5. Résumé lisible

Brouillon « Diagnostic de maturité PMO » avec questions sur gouvernance, conformité aux standards, livraison, reporting (dont automatisation des rapports).

### 6. Points positifs observables

- Cible PMO / gouvernance / reporting cohérente avec la demande.  
- Pas de collecte d’e-mail évidente dans les titres principaux (à vérifier en lecture complète).

### 7. Problèmes potentiels

- Question sur le **niveau d’autonomie** des équipes (échelle) : le maximum est-il toujours présenté comme préférable ?  
- « Les rapports de statut sont-ils **automatisés** ? » scorée oui/non — risque de traiter l’automatisation comme une **finalité**.  
- Correctif 19L (1.3.1) non validé LIVE ici.

### 8. Questions de contrôle

- [ ] Maturité fondée sur la **valeur** apportée ?  
- [ ] Décisions / arbitrages correctement évalués ?  
- [ ] Automatisation = moyen, pas finalité ?  
- [ ] Autonomie maximale non présentée comme toujours préférable ?

### 9–10. Notation et décision

| Critère 1→10 (notes) |  |  |  |  |  |  |  |  |  |  |
|----------------------|--|--|--|--|--|--|--|--|--|--|
| Note |  |  |  |  |  |  |  |  |  |  |
| Total / 50 |  | Justification globale : |  |  |  |  |  |  |  |  |

| Décision (`OK`/`REWORK`/`REJECT`) | Commentaires | Reviewer / date |
|-----------------------------------|--------------|-----------------|
|  |  |  |

---

## A3 — Qualification de prospects B2B

### 1. Contexte

Scorecard de qualification B2B mid-market (besoin, urgence, maturité d’achat, adéquation) **sans** collecte d’e-mail.

### 2. Données d’entrée

> « Scorecard de qualification de prospects B2B mid-market fictifs : besoin métier, urgence, maturité d’achat et adéquation solution — sans collecte d’e-mail. »

### 3. Version

**generate_scorecard_draft v1.3.0**

### 4. Réponse historique complète

**Annexe :** 19K **Fiche 3** (`d19j_draft_prospects`).

### 5. Résumé lisible

Questionnaire de qualification (problème métier, criticité, budget, délai, adéquation solution, etc.).

### 6. Points positifs observables

- Axes besoin / urgence / adéquation présents.  
- Demande « sans e-mail » en entrée.

### 7. Problèmes potentiels

- Question scorée oui/non : « Le prospect a-t-il exprimé des **contraintes de conformité ou de sécurité** ? » avec **Oui = 10 points** — risque de **récompenser la seule existence** d’une contrainte plutôt que la capacité à y répondre.  
- Correctif 19L (contraintes ≠ points automatiques) — à retester LIVE.

### 8. Questions de contrôle

- [ ] Contraintes distinguées de l’adéquation commerciale ?  
- [ ] Pas de collecte inutile de coordonnées ?  
- [ ] Scores = pertinence réelle du prospect ?

### 9–10. Notation et décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

## A4 — Demande ambiguë (leadership ou ventes)

### 1. Contexte

Entrée volontairement floue : leadership **ou** ventes, sans priorité.

### 2. Données d’entrée

> « Je voudrais quelque chose sur le leadership ou les ventes. »

### 3. Version

**generate_scorecard_draft v1.3.0**

### 4. Réponse historique complète

**Annexe :** 19K **Fiche 4** (`d19j_draft_ambiguous`).

### 5. Résumé lisible

Le système **ne crée pas** de scorecard. Il pose une question de clarification : leadership, ventes, ou les deux (hybride), avec disclaimers « aucune scorecard créée ni persistée ».

### 6. Points positifs observables

- Statut de clarification explicite.  
- Options claires.  
- Pas de persistance annoncée.

### 7. Problèmes potentiels

- À juger si la question est assez claire pour un utilisateur métier.

### 8. Questions de contrôle

- [ ] Clarification pertinente ?  
- [ ] Aucune scorecard arbitraire générée ?

### 9–10. Notation et décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

# Groupe B — Analyse des résultats

*Rappel : le Pattern d’analyse est resté en **1.3.0** (pas de refonte 19L). Les scores affichés doivent être ceux fournis en entrée.*

---

## B1 — Score faible

### Contexte / entrée

Scorecard « Maturité PMO » — global **27 %** ; Gouvernance 18 %, Livraison 32 %, Reporting 30 %.

### Version

**analyze_scorecard_results v1.3.0**

### Réponse complète

**Annexe :** 19K **Fiche 5** (`d19j_analyze_low`).

### Résumé lisible

Analyse d’un profil faible : reprise des scores, forces/écarts, limites d’échantillon.

### Points positifs / vigilance

- Contrôle technique 19J : intégrité des scores **PASS** (echo = entrée).  
- Vérifier faits vs interprétations et absence de causes inventées.

### Questions de contrôle (B)

- [ ] Scores officiels strictement conservés ?  
- [ ] Faits séparés des interprétations ?  
- [ ] Limites des données explicites ?  
- [ ] Pas de causes inventées ?

### Notation / décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

## B2 — Score élevé (petits écarts)

### Contexte / entrée

Global **88 %** ; Outils **92 %** ; Collaboration **85 %** ; Sécurité **87 %**.

### Version

**analyze_scorecard_results v1.3.0**

### Réponse complète

**Annexe :** 19K **Fiche 6** (`d19j_analyze_high`).

### Résumé lisible

Constat d’un profil « Élevé » ; écarts de quelques points entre catégories ; recommandation de surveiller avant d’agir ; limites (1 répondant synthétique).

### Points positifs / vigilance

- Echo 88 / 92 / 85 / 87 présent dans la réponse.  
- Prudence affichée sur les petits écarts — à valider qualitativement.

### Notation / décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

## B3 — Résultats déséquilibrés

### Contexte

Global **54 %** avec catégories très hétérogènes (détail dans Fiche 7).

### Version

**analyze_scorecard_results v1.3.0**

### Réponse complète

**Annexe :** 19K **Fiche 7** (`d19j_analyze_imbalanced`).

### Résumé / vigilance

Vérifier que le déséquilibre est décrit sans inventer d’organisation réelle, et que les scores d’entrée sont repris tels quels.

### Notation / décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

## B4 — Données partielles

### Contexte

Global **61 %** avec jeu de catégories / métadonnées partielles (Fiche 8).

### Version

**analyze_scorecard_results v1.3.0**

### Réponse complète

**Annexe :** 19K **Fiche 8** (`d19j_analyze_partial`).

### Résumé / vigilance

Les **limites d’analyse** doivent être explicites ; pas de sur-interprétation faute de données.

### Notation / décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

# Groupe C — Plans d’action

---

## C1 — Développement des compétences

### Contexte / entrée

Lacunes risques / communication / jalons ; contraintes : **budget formation limité**, **3 h / semaine**.

### Version

**generate_action_plan v1.3.0** (historique)

### Réponse complète

**Annexe :** 19K **Fiche 9** (`d19j_plan_skills`).

### Résumé lisible

Plan avec ateliers (risques, communication, jalons) calés sur des horizons 30/90 jours ; faits / hypothèses / infos manquantes.

### Points positifs / vigilance

- Actions plutôt compatibles avec peu d’heures.  
- **Problème documenté 19L :** la réponse historique met `requiresArbitration: true` alors que la contrainte est un **budget limité** (pas un budget exclusif pour un seul chantier). Un relecteur doit juger si cet arbitrage est **injustifié**.  
- Correctif code 1.3.1 : arbitrage seulement si contrainte **exclusive** — **non prouvé LIVE** sur cette fiche 1.3.0.

### Questions de contrôle

- [ ] Budget limité → arbitrage injustifié ?  
- [ ] Disponibilité 3 h respectée ?  
- [ ] Échéances cohérentes ?

### Notation / décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

## C2 — Amélioration PMO

### Contexte / entrée

Trop de reporting, peu d’indicateurs décisionnels ; **pas de nouvel outil cette année** ; **équipe de 3**.

### Version

**generate_action_plan v1.3.0**

### Réponse complète

**Annexe :** 19K **Fiche 10** (`d19j_plan_pmo`).

### Résumé lisible

Actions autour d’un tableau de bord décisionnel (fichier partagé), priorisation portefeuille, rationalisation du reporting, formation interne ; `requiresArbitration: false`.

### Points positifs / vigilance

- Semble éviter un nouvel outil SaaS (fichier partagé).  
- Vérifier réalisme pour 3 personnes et tout % présenté comme **cible à valider**.

### Questions de contrôle

- [ ] Actions réalistes pour 3 personnes ?  
- [ ] % = hypothèses à valider ?  
- [ ] Interdiction de nouvel outil respectée ?

### Notation / décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

## C3 — Transformation digitale

### Contexte

Adoption inégale des outils collaboratifs ; pas de recrutement IT immédiat ; changement progressif.

### Version

**generate_action_plan v1.3.0**

### Réponse complète

**Annexe :** 19K **Fiche 11** (`d19j_plan_digital`).

### Résumé lisible

Rituels de suivi, champions d’outils, tableau d’adoption, revue mensuelle — sans recrutement IT.

### Questions de contrôle

- [ ] Capacités techniques non démontrées présupposées ?  
- [ ] Dépendances clairement identifiées ?

### Notation / décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

## C4 — Arbitrage entre priorités concurrentes

### Contexte / entrée

Satisfaction client ↓, coûts ↑, compétences concentrées ; **budget unique pour un seul chantier majeur** ; délai **90 jours**.

### Version

**generate_action_plan v1.3.0**

### Réponse complète

**Annexe :** 19K **Fiche 12** (`d19j_plan_competing`).

### Résumé lisible

Le système demande un **arbitrage** (quel chantier prioriser) et propose une matrice + plans **conditionnels** pour chaque écart, sans choisir à la place du sponsor. Disclaimers : aucun résultat garanti.

### Points positifs / vigilance

- Conflit de ressources reconnu.  
- Arbitrage demandé plutôt qu’imposé (à confirmer en lecture).  
- Correctif 19L : conserver ce comportement pour les contraintes exclusives.

### Questions de contrôle

- [ ] Conflit de ressources reconnu ?  
- [ ] Arbitrage demandé, pas décidé arbitrairement ?  
- [ ] Plans conditionnels cohérents ?

### Notation / décision

| Total / 50 |  | Décision |  | Commentaires |  | Reviewer / date |  |

---

# Matrice de traçabilité

| Scénario | Version historique | Défaut observé (doc 19L / lecture) | Correctif 19L | Test MOCK (indicatif) | LIVE encore nécessaire ? | Décision humaine |
|----------|-------------------|-------------------------------------|---------------|------------------------|--------------------------|------------------|
| A1 PMP | draft 1.3.0 | Biais fréquence / outil | Prompt anti-biais → **1.3.1** | `lot19l-business-fixes` PMP | **Oui** (19M) |  |
| A2 PMO | draft 1.3.0 | Autonomie max / automatisation | Idem 1.3.1 | PMO mock 19L | **Oui** |  |
| A3 B2B | draft 1.3.0 | Points pour contrainte sécu seule | Idem 1.3.1 | B2B mock 19L | **Oui** |  |
| A4 Ambigu | draft 1.3.0 | — (clarification OK attendue) | Inchangé | clarification tests | Optionnel |  |
| B1–B4 | analyze 1.3.0 | — (pas de refonte 19L) | Aucun | scoring integrity | Optionnel / non-régression |  |
| C1 Skills | plan 1.3.0 | Arbitrage sur budget limité | Arbitrage exclusif → **1.3.1** | C1 mock 19L/19M | **Oui** |  |
| C2 PMO | plan 1.3.0 | % / réalisme équipe | % à valider + horizons 1.3.1 | C2 mock | **Oui** |  |
| C3 Digital | plan 1.3.0 | Capacités / dépendances | Partiel | plans mock | Souhaitable |  |
| C4 Competing | plan 1.3.0 | — (arbitrage exclusif à garder) | Préservé 1.3.1 | C4 mock | **Oui** (confirmation) |  |

**Rappel :** un correctif de prompt ou un test MOCK **ne prouve pas** qu’une réponse Groq réelle sera correcte. Ne pas écrire `RESOLVED IN LIVE` sans retest LIVE.

---

# Synthèse globale (à compléter après revue)

| Indicateur | Valeur |
|------------|--------|
| Scénarios examinés |  / 12 |
| OK |  *(ne pas préremplir)* |
| REWORK |  |
| REJECT |  |
| Non examinés |  |
| Blocants transverses |  |
| Recommandation pour suite (retest LIVE 19M / autre) |  |
| HUMAN REVIEW | **PENDING** |
| APPROVED produit / versions actuelles | **Non attribué** |

---

## Instructions pratiques pour le relecteur

1. Ouvrir ce dossier et [`lot19p-human-decision-sheet.md`](./lot19p-human-decision-sheet.md).  
2. Pour chaque scénario : lire l’entrée → ouvrir la **Fiche** correspondante dans [`lot19k-business-review-package.md`](./lot19k-business-review-package.md) → lire la **réponse JSON complète**.  
3. Répondre aux questions de contrôle, noter les 10 critères, décider `OK` / `REWORK` / `REJECT`.  
4. Reporter les décisions dans la fiche de décision globale.  
5. Communiquer le fichier rempli à l’équipe produit / AI — **sans** demander une génération LLM pour « améliorer » les notes.  
6. Si des `REWORK` touchent A1–A3 ou C1–C2 : exiger un **LIVE retest** (campagne 19M) avant toute conclusion sur les versions **1.3.1**.
