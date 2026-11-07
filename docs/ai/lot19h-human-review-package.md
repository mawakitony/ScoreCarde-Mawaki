# LOT 19H — Package de revue humaine

**Statut :** HUMAN REVIEW — **PENDING** (aucune note humaine préremplie).

Ce document présente les **12 réponses LIVE** dans un format lisible. Saisir les notes dans `docs/ai/lot19g-human-review.csv` (colonnes de notes encore vides).

## Mode d'emploi

1. Lire l'objectif et le diagnostic / besoin.
2. Lire la proposition IA.
3. Noter les 10 critères de 0 à 5.
4. Indiquer tout défaut bloquant.
5. Renseigner `reviewer_id`, date et décision (OK / REWORK / REJECT).

**Attention versions :** draft et analyze = sorties **v1.2.0** ; plan = **v1.2.1**. Le code actuel est v1.2.1 pour les trois Patterns. Une revue des drafts/analyses 1.2.0 ne valide pas automatiquement le code 1.2.1.

---

## Fiche 1 — `d19d_draft_pmp`

| | |
|--|--|
| Pattern | Génération de scorecard (`generate_scorecard_draft`) |
| Version testée LIVE | **1.2.0** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 1175 / 1930 |
| Latence | 4754 ms |

### Objectif / entrée synthétique

- **Besoin :** Créer une scorecard d'auto-évaluation des pratiques de gestion de projet inspirées du référentiel PMP, sans prétendre à une certification officielle PMI.
- **Locale :** fr · maxQuestions=12 · maxCategories=4

### Contrôles automatiques

- Structure / Zod : **PASS**
- Statut attendu `draft_suggestion` : contrôlé à la génération
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Titre :** Auto-évaluation des pratiques de gestion de projet – approche PMP (brouillon)

**Objectif :** Identifier les points forts et les axes d’amélioration des pratiques de gestion de projet afin de prioriser les actions de montée en maturité.

**Public :** Chefs de projet, PMO et membres d’équipes projet

**Catégories :**
- Initiation (25%)
- Planning (30%)
- Execution (25%)
- Monitoring & Controlling (20%)

**Questions :**
1. [single_choice] Comment formalisez-vous la charte de projet ?
   - Options : Charte signée et diffusée / Charte informelle / Pas de charte
2. [yes_no] Le périmètre du projet est‑il clairement défini et approuvé ?
   - Options : Oui / Non
3. [scale_5] À quelle fréquence élaborez‑vous le plan de gestion des parties prenantes ?
4. [single_choice] Quel niveau de détail utilisez‑vous pour le Work Breakdown Structure (WBS) ?
   - Options : Décomposé jusqu’au niveau des tâches / Décomposé jusqu’aux lots de travail / Décomposition sommaire / Pas de WBS …
5. [yes_no] Utilisez‑vous un registre des exigences ?
   - Options : Oui / Non
6. [scale_10] Quel est le degré d’estimation des coûts (précision) ?
7. [multiple_choice] Comment gérez‑vous les changements de scope ?
   - Options : Processus formel d’évaluation / Approbation du sponsor / Mise à jour du plan / Communication aux équipes …
8. [yes_no] Les équipes utilisent‑elles des outils de suivi des tâches ?
   - Options : Oui / Non
9. [scale_5] À quelle fréquence réalisez‑vous les revues d’avancement (status meetings) ?
10. [yes_no] Disposez‑vous d’un tableau de bord des indicateurs clés (KPIs) ?
   - Options : Oui / Non
11. [long_text] Quelle est votre principale difficulté actuelle en gestion de projet ?

**Avertissements :** Suggestion IA non persistée. · Ne constitue pas une certification PMI ni une validation officielle d’organisme.

**Recommandations Builder :** Faire valider le contenu par un expert PMP interne avant diffusion. · Adapter les scores aux exigences de votre modèle de maturité.

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 2 — `d19d_draft_pmo`

| | |
|--|--|
| Pattern | Génération de scorecard (`generate_scorecard_draft`) |
| Version testée LIVE | **1.2.0** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 1171 / 1934 |
| Latence | 5363 ms |

### Objectif / entrée synthétique

- **Besoin :** Diagnostic de maturité PMO pour une direction de projets fictive de 40 personnes (gouvernance, livraison, reporting).
- **Locale :** fr · maxQuestions=12 · maxCategories=4

### Contrôles automatiques

- Structure / Zod : **PASS**
- Statut attendu `draft_suggestion` : contrôlé à la génération
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Titre :** Diagnostic de maturité PMO

**Objectif :** Évaluer le niveau de maturité du PMO afin d'identifier forces et axes d'amélioration avant la mise en place d'un plan d'action.

**Public :** Responsables PMO, directeurs de projets et membres du comité de gouvernance

**Catégories :**
- Gouvernance (30%)
- Livraison (30%)
- Reporting (20%)
- Amélioration continue (20%)

**Questions :**
1. [single_choice] Quel est le niveau d'autonomie de votre PMO dans la définition des processus ?
   - Options : Totalement autonome / Partiellement autonome / Sous la direction du comité de direction / Pas d'autonomie …
2. [yes_no] Disposez-vous d'un comité de gouvernance projet formel ?
   - Options : Oui / Non
3. [scale_5] À quelle fréquence le comité de gouvernance se réunit-il ?
4. [number] Quel pourcentage des projets respectent les délais prévus ?
5. [single_choice] Utilisez-vous une méthodologie standardisée pour la livraison ?
   - Options : Méthodologie agile (Scrum, Kanban) / Méthodologie en cascade (Waterfall) / Mixte/hybride / Aucune méthodologie définie …
6. [short_text] Quel est le principal obstacle à la livraison à temps ?
7. [multiple_choice] Quel type de reporting est produit chaque mois ?
   - Options : Tableau de bord exécutif / Rapport d'avancement détaillé / Analyse des écarts budgétaires / Aucun reporting …
8. [yes_no] Le reporting est-il automatisé ?
   - Options : Oui / Non
9. [scale_10] Sur une échelle de 1 à 10, comment évaluez-vous la visibilité des projets pour les parties prenantes ?
10. [dropdown] Quel est le processus d'amélioration continue du PMO ?
   - Options : Revues post-mortem systématiques / Retours informels / Pas de processus défini
11. [scale_5] Fréquence des revues d'amélioration continue ?
12. [email] Adresse email du responsable du PMO ?

**Avertissements :** Suggestion IA non persistée. · Ne constitue pas une certification officielle ni une validation d'organisme externe.

**Recommandations Builder :** Faire valider le questionnaire par le responsable PMO avant diffusion. · Adapter les scores aux priorités stratégiques de l'organisation.

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 3 — `d19d_draft_prospects`

| | |
|--|--|
| Pattern | Génération de scorecard (`generate_scorecard_draft`) |
| Version testée LIVE | **1.2.0** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 1174 / 1938 |
| Latence | 4845 ms |

### Objectif / entrée synthétique

- **Besoin :** Scorecard de qualification de prospects B2B mid-market (besoin, budget indicatif, calendrier, décideurs) — données fictives uniquement.
- **Locale :** fr · maxQuestions=12 · maxCategories=4

### Contrôles automatiques

- Structure / Zod : **PASS**
- Statut attendu `draft_suggestion` : contrôlé à la génération
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Titre :** Scorecard de qualification de prospects B2B mid-market

**Objectif :** Qualifier chaque prospect mid‑market en identifiant son besoin, son budget indicatif, son calendrier et les décideurs afin de prioriser les opportunités commerciales.

**Public :** Équipes commerciales B2B, business developers et responsables de comptes

**Catégories :**
- Besoin (30%)
- Budget (25%)
- Calendrier (20%)
- Décideurs (25%)

**Questions :**
1. [short_text] Quel problème principal cherchez-vous à résoudre avec notre solution ?
2. [single_choice] Quel bénéfice clé attendez-vous de la mise en œuvre ?
   - Options : Gain de productivité / Réduction des coûts / Amélioration de la conformité / Autre …
3. [number] Quel est le budget annuel prévu pour ce type de projet ?
4. [yes_no] Le budget est-il déjà approuvé ?
   - Options : Oui / Non
5. [scale_5] Quel est le délai souhaité pour le démarrage du projet ?
6. [single_choice] Quel est le délai total prévu pour la mise en production ?
   - Options : Moins de 3 mois / 3 à 6 mois / 6 à 12 mois / Plus de 12 mois …
7. [dropdown] Qui est le décideur final pour ce projet ?
   - Options : CEO / Directeur Général / CIO / DSI / Directeur Financier / Responsable de département …
8. [multiple_choice] Y a-t-il d’autres parties prenantes influentes ?
   - Options : Equipe IT / Equipe Finance / Equipe Opérations / Consultants externes …
9. [yes_no] Avez-vous déjà évalué d’autres fournisseurs ?
   - Options : Oui / Non
10. [single_choice] Quel est votre principal critère de sélection ?
   - Options : Coût / Fonctionnalités / Support & services / Réputation du fournisseur …

**Avertissements :** Brouillon IA non persistant, à finaliser dans l’outil Builder. · Ne constitue pas une certification officielle ni une validation d’organisme externe.

**Recommandations Builder :** Faire valider le libellé des questions par un responsable commercial avant diffusion. · Tester le questionnaire auprès de 2‑3 prospects pilotes pour affiner les scores.

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 4 — `d19d_draft_ambiguous`

| | |
|--|--|
| Pattern | Génération de scorecard (`generate_scorecard_draft`) |
| Version testée LIVE | **1.2.0** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 1164 / 1410 |
| Latence | 10301 ms |

### Objectif / entrée synthétique

- **Besoin :** Je ne sais pas trop — quelque chose sur le leadership ou peut-être les ventes, à préciser.
- **Locale :** fr · maxQuestions=12 · maxCategories=4

### Contrôles automatiques

- Structure / Zod : **PASS**
- Statut attendu `draft_suggestion` : contrôlé à la génération
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Titre :** Auto‑évaluation leadership et performance commerciale

**Objectif :** Identifier points forts et axes d'amélioration en leadership et techniques de vente afin de guider un plan de développement individuel.

**Public :** Managers, chefs d'équipe et responsables commerciaux

**Catégories :**
- Leadership (40%)
- Vente (35%)
- Développement des compétences (25%)

**Questions :**
1. [single_choice] Quel style de leadership adoptez‑vous principalement ?
   - Options : Transformateur (inspire et motive) / Transactionnel (orienté objectifs) / Laisser‑faire (autonomie maximale) / Aucun style défini …
2. [scale_5] À quelle fréquence organisez‑vous des séances de coaching avec votre équipe ?
3. [yes_no] Utilisez‑vous des indicateurs de performance (KPI) pour suivre votre équipe ?
   - Options : Oui / Non
4. [single_choice] Quelle méthodologie de vente appliquez‑vous le plus souvent ?
   - Options : Solution Selling / SPIN Selling / Méthode Challenger / Aucune méthode structurée …
5. [scale_10] À quelle fréquence revoyez‑vous votre pipeline commercial ?
6. [multiple_choice] Quelles compétences vous aident le plus à conclure une vente ? (choisissez jusqu'à 3)
   - Options : Écoute active / Argumentation produit / Gestion des objections / Négociation tarifaire …
7. [scale_5] Comment évaluez‑vous votre communication avec les clients sur une échelle de 1 à 5 ?
8. [number] Combien de nouveaux clients avez‑vous acquis au cours du dernier trimestre ?
9. [short_text] Quel est le principal obstacle à l'atteinte de vos objectifs de vente ?
10. [dropdown] Quel format de formation privilégiez‑vous pour développer vos compétences commerciales ?
   - Options : Ateliers en présentiel / Webinaires / Cours en ligne autonomes / Coaching individuel …

**Avertissements :** Suggestion IA non persistée. · Ne constitue pas une certification officielle ni une validation d'organisme externe.

**Recommandations Builder :** Faire valider le contenu par un responsable RH ou commercial avant diffusion. · Tester le questionnaire auprès d'un petit groupe pilote pour affiner les libellés.

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 5 — `d19d_analyze_low`

| | |
|--|--|
| Pattern | Analyse des résultats (`analyze_scorecard_results`) |
| Version testée LIVE | **1.2.0** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 889 / 785 |
| Latence | 23406 ms |

### Objectif / entrée synthétique

- **Scorecard :** Maturité PMO (synthétique)
- **Objectif :** Mesurer la maturité PMO
- **Score global officiel :** 27 %
- **Catégories :** Gouvernance 18% · Livraison 32% · Reporting 30%
- **Seuils :** Faible [0-39]
- **Métadonnées :** respondants=1, notes=échantillon synthétique faible

### Contrôles automatiques

- Structure / Zod : **PASS**
- Intégrité scores (echo = entrée) : **PASS** (campagne 19D)
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Résumé :** Le score global de 27 % place le profil dans la bande Faible (0–39 %).

**Points forts :**
- Les catégories Livraison (32 %) et Reporting (30 %) sont supérieures au score global (27 %).

**Axes d'amélioration :**
- La catégorie Gouvernance (18 %) est nettement inférieure au score global et constitue le principal point faible.

**Explications :**
- Les pourcentages cités (global 27 %, Gouvernance 18 %, Livraison 32 %, Reporting 30 %) proviennent exclusivement de l’entrée.
- Toutes les catégories se situent dans le seuil « Faible » (0–39 %).

**Recommandations :**
- Renforcer les pratiques de gouvernance pour rapprocher son score de celui des autres catégories.
- Collecter davantage de réponses (actuellement 1) afin d’obtenir une évaluation plus fiable.
- Comparer les scores aux seuils métier avant de définir des actions ciblées.

**Limites d'analyse :**
- Échantillon très limité (respondentCount = 1) ; les conclusions sont donc incertaines.
- Aucune donnée contextuelle supplémentaire n’est disponible pour expliquer les écarts.

**Scores officiels repris (doivent = entrée) :** global 27 % · Gouvernance 18% · Livraison 32% · Reporting 30%

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 6 — `d19d_analyze_high`

| | |
|--|--|
| Pattern | Analyse des résultats (`analyze_scorecard_results`) |
| Version testée LIVE | **1.2.0** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 888 / 953 |
| Latence | 13319 ms |

### Objectif / entrée synthétique

- **Scorecard :** Compétences digitales (synthétique)
- **Objectif :** Cartographier les compétences numériques
- **Score global officiel :** 88 %
- **Catégories :** Outils 92% · Collaboration 85% · Sécurité 87%
- **Seuils :** Élevé [75-100]
- **Métadonnées :** respondants=1, notes=échantillon synthétique élevé

### Contrôles automatiques

- Structure / Zod : **PASS**
- Intégrité scores (echo = entrée) : **PASS** (campagne 19D)
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Résumé :** Le score global est de 88 %, placé dans la bande Élevé (75–100 %).

**Points forts :**
- La catégorie Outils (92 %) dépasse le score global (88 %).
- Toutes les catégories (Outils 92 %, Collaboration 85 %, Sécurité 87 %) se situent dans la tranche Élevé (75–100 %).

**Axes d'amélioration :**
- Les catégories Collaboration (85 %) et Sécurité (87 %) sont en dessous du score global (88 %).

**Explications :**
- Les pourcentages cités (global 88 %, Outils 92 %, Collaboration 85 %, Sécurité 87 %) proviennent exclusivement de l’entrée.
- Aucune cause sous‑jacente n’est déduite faute de données supplémentaires.

**Recommandations :**
- Consolider les compétences en Collaboration pour atteindre ou dépasser le niveau Outils.
- Renforcer les pratiques de Sécurité afin d’aligner ce score avec le global.
- Augmenter le nombre de répondants pour valider la robustesse des scores.

**Limites d'analyse :**
- Échantillon très limité (respondentCount = 1), ce qui réduit la fiabilité de l’interprétation.
- Les données sont synthétiques et ne reflètent peut‑être pas la réalité organisationnelle.

**Scores officiels repris (doivent = entrée) :** global 88 % · Outils 92% · Collaboration 85% · Sécurité 87%

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 7 — `d19d_analyze_imbalanced`

| | |
|--|--|
| Pattern | Analyse des résultats (`analyze_scorecard_results`) |
| Version testée LIVE | **1.2.0** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 885 / 816 |
| Latence | 13242 ms |

### Objectif / entrée synthétique

- **Scorecard :** Leadership de proximité (synthétique)
- **Objectif :** Évaluer les pratiques de leadership
- **Score global officiel :** 54 %
- **Catégories :** Communication 82% · Délégation 28% · Feedback 51%
- **Seuils :** Intermédiaire [40-74]
- **Métadonnées :** respondants=1, notes=déséquilibre synthétique

### Contrôles automatiques

- Structure / Zod : **PASS**
- Intégrité scores (echo = entrée) : **PASS** (campagne 19D)
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Résumé :** Avec un score global de 54 %, le profil se situe dans la bande Intermédiaire (40–74 %).

**Points forts :**
- La catégorie Communication (82 %) est nettement au-dessus du score global.

**Axes d'amélioration :**
- La catégorie Délégation (28 %) est bien en dessous du score global.
- La catégorie Feedback (51 %) est légèrement en dessous du score global.

**Explications :**
- Les pourcentages cités (global 54 %, Communication 82 %, Délégation 28 %, Feedback 51 %) proviennent exclusivement de l’entrée.
- Aucune cause sous‑jacente n’est déduite faute de données supplémentaires.

**Recommandations :**
- Renforcer les pratiques de délégation, par exemple en définissant des responsabilités claires.
- Améliorer le feedback en instaurant des revues régulières.
- Collecter davantage de réponses pour réduire l’incertitude liée à un échantillon de 1 répondant.

**Limites d'analyse :**
- Échantillon très limité (1 répondant) ; les conclusions restent prudentes.
- Le score provient d’une synthèse, ce qui peut masquer des variations internes.

**Scores officiels repris (doivent = entrée) :** global 54 % · Communication 82% · Délégation 28% · Feedback 51%

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 8 — `d19d_analyze_partial`

| | |
|--|--|
| Pattern | Analyse des résultats (`analyze_scorecard_results`) |
| Version testée LIVE | **1.2.0** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 842 / 637 |
| Latence | 12553 ms |

### Objectif / entrée synthétique

- **Scorecard :** Diagnostic partiel (synthétique)
- **Objectif :** Interpréter un résultat incomplet
- **Score global officiel :** 61 %
- **Catégories :** Processus 61%
- **Métadonnées :** respondants=1

### Contrôles automatiques

- Structure / Zod : **PASS**
- Intégrité scores (echo = entrée) : **PASS** (campagne 19D)
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Résumé :** Le score global est de 61 % avec une seule catégorie fournie, Processus, également à 61 %.

**Points forts :**
- _(aucun — données insuffisantes)_

**Axes d'amélioration :**
- _(aucun — données insuffisantes)_

**Explications :**
- Le pourcentage global fourni est 61 % et la catégorie Processus a également 61 % selon les données d’entrée.
- Aucune catégorie n’est au‑dessus ou en‑dessous du score global, donc aucune force ou faiblesse claire ne peut être identifiée.

**Recommandations :**
- Collecter davantage de réponses pour augmenter la fiabilité de l’interprétation.
- Enrichir le scorecard avec d’autres catégories afin de pouvoir comparer les performances relatives.

**Limites d'analyse :**
- Échantillon très limité : seulement 1 répondant.
- Une seule catégorie disponible, ce qui empêche une analyse comparative détaillée.

**Scores officiels repris (doivent = entrée) :** global 61 % · Processus 61%

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 9 — `d19f_plan_skills`

| | |
|--|--|
| Pattern | Plan d'action (`generate_action_plan`) |
| Version testée LIVE | **1.2.1** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 968 / 1072 |
| Latence | 3187 ms |

### Objectif / entrée synthétique

- **Situation :** Diagnostic synthétique d'une équipe projet fictive : lacunes en gestion des risques, communication parties prenantes irrégulière et planification des jalons peu formalisée. Bases techniques correctes.
- **Cas d'usage :** developpement_competences
- **Forces :** Bases techniques correctes · Motivation individuelle
- **Écarts :** Gestion des risques peu structurée · Communication parties prenantes irrégulière · Planification des jalons peu formalisée
- **Contraintes :** Budget formation limité · Disponibilité 3h/semaine

### Contrôles automatiques

- Structure / Zod : **PASS**
- Exactement 3 priorités + ≥3 actions : contrôlé Zod
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Synthèse :** Équipe projet avec bonnes bases techniques et forte motivation individuelle, mais lacunes identifiées en gestion des risques, communication irrégulière avec les parties prenantes et planification des jalons peu formalisée. Budget formation limité et disponibilité collective de 3 h/semaine.

**Priorités :**
1. Structurer la gestion des risques avec un processus léger utilisable en 3 h/semaine
2. Instaurer un rythme de communication hebdomadaire avec les parties prenantes
3. Formaliser la planification des jalons via un modèle partagé

**Actions :**
- **Atelier de création d'un registre de risques simplifié** (haute · immédiat)
  - Organiser une session de 2 h (dans le créneau de 3 h/semaine) pour identifier, classer et assigner les risques majeurs du projet, puis consigner le registre dans un tableau partagé.
  - Résultat attendu : Registre de risques contenant au moins 10 entrées avec propriétaire et plan d’atténuation
  - Indicateur : Document partagé daté et validé par le chef de projet sous 5 jours
- **Mise en place d'un point de synchronisation hebdomadaire de 30 min** (haute · 30_jours)
  - Planifier chaque lundi un créneau de 30 min où le responsable projet présente l’avancement, les risques actifs et les décisions attendues aux parties prenantes clés.
  - Résultat attendu : Réduction de 50 % des demandes d’information non planifiées
  - Indicateur : Compte‑rendu de chaque réunion enregistré dans le drive, avec taux de participation ≥ 80 % sur 4 semaines
- **Adoption d'un modèle de jalons projet standardisé** (moyenne · 90_jours)
  - Développer, en 1 h, un modèle de feuille de route (jalons, livrables, dates cibles) à remplir par chaque équipe, puis le diffuser et le mettre à jour lors du point hebdomadaire.
  - Résultat attendu : Tous les projets utilisent le même format de planning, facilitant le suivi transversal
  - Indicateur : Modèle rempli et partagé pour 3 projets pilotes d'ici 90 jours
- **Révision mensuelle du registre de risques et du planning** (moyenne · 6_mois)
  - Allouer 1 h chaque fin de mois pour comparer les risques réels aux prévisions et ajuster les jalons en fonction des écarts constatés.
  - Résultat attendu : Mise à jour proactive du planning et du registre, limitant les dépassements de dates à < 10 %
  - Indicateur : Rapport mensuel signé par le sponsor projet pendant 3 mois consécutifs

**Faits :** Les forces et écarts fournis en entrée sont les seuls faits retenus. · Disponibilité collective de 3 h/semaine et budget formation limité sont des contraintes réelles.

**Hypothèses :** L’équipe dispose d’outils de partage (drive, tableau collaboratif) déjà opérationnels. · Les parties prenantes sont réceptives à un créneau de synchronisation hebdomadaire.

**Recommandations :** Valider le planning des ateliers avec le manager afin de garantir le créneau de 3 h/semaine. · Utiliser des outils déjà sous licence (ex. Google Sheets) pour éviter tout coût supplémentaire.

**Avertissements :** Aucun résultat n'est garanti. · Aucune formation, prix ou offre WOLOYEM n'est mentionné(e).

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 10 — `d19f_plan_pmo`

| | |
|--|--|
| Pattern | Plan d'action (`generate_action_plan`) |
| Version testée LIVE | **1.2.1** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 971 / 1402 |
| Latence | 20413 ms |

### Objectif / entrée synthétique

- **Situation :** Organisation fictive dont le PMO produit un volume élevé de reporting opérationnel mais manque d'indicateurs utiles à l'arbitrage et à la priorisation du portefeuille.
- **Cas d'usage :** maturite_organisationnelle
- **Forces :** Discipline de reporting établie · Sponsor direction présent
- **Écarts :** Indicateurs peu orientés décision · Priorisation de portefeuille floue · Temps passé en reporting au détriment de l'arbitrage
- **Contraintes :** Pas de nouvel outil cette année · Équipe PMO de 3 personnes

### Contrôles automatiques

- Structure / Zod : **PASS**
- Exactement 3 priorités + ≥3 actions : contrôlé Zod
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Synthèse :** Le PMO délivre un reporting opérationnel volumineux mais ne fournit pas d’indicateurs utiles à l’arbitrage ni à la priorisation du portefeuille. Les forces sont la discipline de reporting et la présence d’un sponsor directionnel. Les écarts portent sur la pertinence des indicateurs, la clarté de la priorisation et le temps consacré au reporting au détriment de l’arbitrage. Contraintes : aucun nouvel outil cette année et équipe PMO de 3 personnes.

**Priorités :**
1. Définir des indicateurs décisionnels pertinents
2. Instaurer un cadre de priorisation du portefeuille
3. Réduire le temps consacré au reporting pour libérer de la capacité d’arbitrage

**Actions :**
- **Cartographie des besoins décisionnels** (haute · immédiat)
  - Organiser un atelier de 2 h avec le sponsor directionnel et les responsables métiers pour identifier les décisions clés à soutenir et les indicateurs associés, puis formaliser le résultat dans un document partagé.
  - Résultat attendu : Liste validée des décisions à arbitrer et des indicateurs associés
  - Indicateur : Document de cartographie signé par le sponsor sous 7 jours
- **Sélection et mise en place de 3 indicateurs décisionnels** (haute · 30_jours)
  - À partir de la cartographie, choisir les trois KPI les plus critiques, définir leur mode de calcul, assigner un propriétaire et les intégrer dans le reporting existant sans outil supplémentaire (ex. tableau Excel automatisé).
  - Résultat attendu : Trois KPI décisionnels opérationnels intégrés au reporting
  - Indicateur : Tableau de suivi des KPI mis à jour et diffusé à J+30
- **Processus de priorisation du portefeuille** (moyenne · 90_jours)
  - Concevoir un cadre de scoring simple (valeur, effort, risque) à appliquer aux projets, créer un modèle Excel partagé et former les 3 membres du PMO à son utilisation.
  - Résultat attendu : Méthodologie de priorisation appliquée à l’ensemble du portefeuille
  - Indicateur : Score de chaque projet renseigné dans le reporting à J+90
- **Optimisation du temps de reporting** (moyenne · 6_mois)
  - Analyser le temps passé sur chaque livrable de reporting, identifier les redondances et automatiser les extractions de données via macros Excel afin de réduire le temps de production de 20 %.
  - Résultat attendu : Réduction mesurable du temps dédié au reporting
  - Indicateur : Heures mensuelles de production de reporting diminuées de 20 % à J+180

**Faits :** Discipline de reporting établie · Sponsor direction présent · Indicateurs peu orientés décision · Priorisation de portefeuille floue · Temps excessif dédié au reporting

**Hypothèses :** L’absence d’indicateurs décisionnels résulte d’un manque de formalisation des besoins métiers · Le processus actuel de priorisation n’est pas documenté, d’où la confusion · Le reporting volumineux consomme la capacité de l’équipe PMO

**Recommandations :** Valider chaque livrable avec le sponsor avant diffusion · Impliquer les responsables métiers dès la phase de définition des KPI · Suivre les indicateurs de succès chaque mois pour ajuster le plan

**Avertissements :** Aucun résultat n’est garanti · Aucune offre, prix ou formation WOLOYEM n’est mentionnée · Aucun outil externe n’est requis

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 11 — `d19f_plan_digital`

| | |
|--|--|
| Pattern | Plan d'action (`generate_action_plan`) |
| Version testée LIVE | **1.2.1** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 969 / 1197 |
| Latence | 23496 ms |

### Objectif / entrée synthétique

- **Situation :** Organisation fictive en transformation digitale : adoption inégale des outils collaboratifs et coordination inter-équipes insuffisante, malgré un sponsor digital identifié.
- **Cas d'usage :** maturite_organisationnelle
- **Forces :** Sponsor digital identifié · Quelques équipes déjà à l'aise avec les outils
- **Écarts :** Adoption inégale des outils · Coordination inter-équipes insuffisante · Manque de rituels de suivi communs
- **Contraintes :** Pas de recrutement IT immédiat · Changement progressif exigé

### Contrôles automatiques

- Structure / Zod : **PASS**
- Exactement 3 priorités + ≥3 actions : contrôlé Zod
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Synthèse :** Organisation en transformation digitale avec un sponsor identifié et quelques équipes déjà autonomes, mais adoption inégale des outils collaboratifs, coordination inter‑équipes insuffisante et absence de rituels de suivi communs.

**Priorités :**
1. Uniformiser l'adoption des outils collaboratifs
2. Instaurer des rituels de suivi inter‑équipes
3. Renforcer la coordination via un cadre de gouvernance léger

**Actions :**
- **Atelier de diagnostic d'adoption par équipe** (haute · immédiat)
  - Organiser, d'ici 7 jours, un atelier de 1 h avec chaque équipe pour recenser freins, besoins et bonnes pratiques liés aux outils collaboratifs.
  - Résultat attendu : Liste des freins et propositions d'actions ciblées par équipe
  - Indicateur : Compte‑rendu daté et partagé sous 7 jours
- **Tableau de bord d'adoption partagé** (haute · 30_jours)
  - Créer un tableau de suivi (ex. Google Sheet) recensant le taux d'usage des outils par équipe, mis à jour chaque vendredi.
  - Résultat attendu : Tableau opérationnel avec indicateurs d'usage mensuels
  - Indicateur : Mise à jour hebdomadaire pendant 4 semaines et première rapport d'évolution à J+30
- **Rituel de synchronisation inter‑équipes** (moyenne · 30_jours)
  - Instaurer un meeting de 15 minutes chaque lundi matin réunissant les leads d'équipes pour partager avancées, blocages et priorités.
  - Résultat attendu : Agenda partagé et suivi des actions inter‑équipes
  - Indicateur : Présence de ≥80 % des leads pendant 4 semaines consécutives
- **Guide de bonnes pratiques d'outils collaboratifs** (basse · 90_jours)
  - Rédiger, valider et diffuser un guide de 2‑3 pages résumant les usages recommandés, les raccourcis et les points de contact support.
  - Résultat attendu : Guide publié sur l'intranet et communiqué à toutes les équipes
  - Indicateur : Accès enregistré par ≥60 % des équipes d'ici J+90

**Faits :** Sponsor digital identifié · Quelques équipes déjà à l'aise avec les outils · Adoption inégale des outils · Coordination inter‑équipes insuffisante · Manque de rituels de suivi communs

**Hypothèses :** Les résistances sont majoritairement culturelles et liées à l'absence de visibilité sur les bénéfices

**Recommandations :** Faire valider ce plan par le sponsor digital avant lancement · Nommer un coordinateur adoption (pas de recrutement externe) · Suivre les indicateurs de succès chaque fin de période définie

**Avertissements :** Aucun résultat n'est garanti · Aucune offre, prix ou formation WOLOYEM n'est mentionnée · Aucun CRM réel ou relance automatique n'est prévu

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Fiche 12 — `d19f_plan_competing`

| | |
|--|--|
| Pattern | Plan d'action (`generate_action_plan`) |
| Version testée LIVE | **1.2.1** |
| Modèle | openai/gpt-oss-120b |
| Zod | PASS |
| Tokens (in/out) | 962 / 996 |
| Latence | 20270 ms |

### Objectif / entrée synthétique

- **Situation :** Organisation fictive aux ressources limitées confrontée simultanément à une baisse de satisfaction client, des coûts opérationnels élevés et une concentration des compétences critiques — sans arbitrage fourni.
- **Cas d'usage :** performance_equipe
- **Forces :** Équipe motivée · Process de base documentés
- **Écarts :** Satisfaction client en baisse · Coûts opérationnels élevés · Compétences critiques concentrées sur peu de personnes
- **Contraintes :** Budget unique pour un seul chantier majeur · Délai 90 jours

### Contrôles automatiques

- Structure / Zod : **PASS**
- Exactement 3 priorités + ≥3 actions : contrôlé Zod
- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)

### Proposition IA (lisible)

**Synthèse :** Organisation à ressources limitées, forces : équipe motivée, processus de base documentés. Écarts majeurs : satisfaction client en baisse, coûts opérationnels élevés, compétences critiques concentrées sur peu de personnes. Contraintes : budget unique pour un seul chantier majeur, délai de 90 jours.

**Priorités :**
1. Choisir un chantier unique à fort impact combinant amélioration de la satisfaction client et réduction des coûts
2. Mettre en place un suivi quotidien des indicateurs clés liés aux écarts
3. Diffuser les compétences critiques via un programme de partage ciblé

**Actions :**
- **Lancement d'un chantier d'optimisation du flux de traitement client** (haute · 30_jours)
  - Définir, en 2 semaines, un processus simplifié de prise en charge des demandes client (cartographie, points de friction, automatisation partielle). Implémenter le nouveau flux sur un segment pilote (10% du volume) puis étendre. Impliquer les deux experts critiques pour co‑concevoir les étapes afin de réduire la concentration de compétences.
  - Résultat attendu : Processus pilote fonctionnel, réduction du temps de traitement de 20%
  - Indicateur : Rapport de performance du segment pilote signé avant J+30
- **Mise en place d'un tableau de bord opérationnel quotidien** (moyenne · immédiat)
  - Créer un tableau de bord partagé (Excel ou outil libre) affichant : taux de satisfaction client (NPS), coût moyen par transaction, charge de travail des experts critiques. Actualiser chaque matin et diffuser à l'équipe de pilotage.
  - Résultat attendu : Visibilité quotidienne des écarts et prise de décision rapide
  - Indicateur : Tableau de bord opérationnel disponible et mis à jour chaque jour pendant 14 jours consécutifs
- **Programme de transfert de compétences "Buddy" sur 90 jours** (moyenne · 90_jours)
  - Organiser des binômes entre les experts critiques et 2 collaborateurs intermédiaires chacun. Chaque binôme réalise 2 sessions de travail pratique par semaine pendant 6 semaines, avec livrable de procédure détaillée. Objectif : réduire la dépendance à 2 experts à 4 personnes capables d'assurer la continuité.
  - Résultat attendu : 4 collaborateurs formés aux compétences critiques, documentation mise à jour
  - Indicateur : Liste signée des participants et livrables de procédure validés à J+90

**Faits :** Équipe motivée · Process de base documentés · Satisfaction client en baisse · Coûts opérationnels élevés · Compétences critiques concentrées

**Hypothèses :** Les coûts élevés proviennent d'étapes manuelles redondantes · La baisse de satisfaction est liée à des délais de réponse trop longs

**Recommandations :** Valider le périmètre du chantier pilote avec le responsable service client avant le démarrage · Assigner un coordinateur projet dédié pour le suivi du tableau de bord

**Avertissements :** Aucun résultat n'est garanti · Aucune offre, prix ou formation WOLOYEM n'est mentionné

### Zone de notation humaine (à remplir)

| Critère | Note |
|---------|------|
| Pertinence (0-5) |  |
| Précision (0-5) |  |
| Cohérence métier (0-5) |  |
| Clarté (0-5) |  |
| Utilité (0-5) |  |
| Respect des données (0-5) |  |
| Absence d'inventions (0-5) |  |
| Structure (0-5) |  |
| Adaptation au contexte (0-5) |  |
| Exploitabilité WOLOYEM (0-5) |  |

| Champ | Valeur |
|-------|--------|
| Commentaires |  |
| Défauts bloquants |  |
| Reviewer ID |  |
| Date |  |
| Décision (OK / REWORK / REJECT) |  |

---

## Rappel

Saisir les notes finales dans `docs/ai/lot19g-human-review.csv`. Tant qu'aucune ligne n'est remplie par un réviseur, **HUMAN REVIEW reste PENDING**.
