# LOT 19Q — Grille de validation des 8 scénarios LIVE (versions actuelles)

**Statut campagne LIVE 19M :** `PREPARED_NOT_RUN` (non exécutée)  
**HUMAN REVIEW :** `PENDING`  
**Aucune note, aucun résultat LIVE, aucune décision préremplie.**

Versions à valider après un futur LIVE autorisé :

| Pattern | Version |
|---------|---------|
| `generate_scorecard_draft` | **1.3.1** |
| `analyze_scorecard_results` | **1.3.0** |
| `generate_action_plan` | **1.3.1** |

Dataset : `lib/ai/fabric-prototype/eval/lot19m-dataset.ts`  
Préparation : `docs/ai/lot19m-live-retest-preparation.md`  
Grille 19M (complément) : `docs/ai/lot19m-human-review-grid.md`

**Rappel :** les 12 scénarios historiques 19K (v1.3.0) ne valident **pas** ces versions. Remplir cette grille **uniquement** après lecture des sorties LIVE 19M réelles.

Décisions : `OK` · `REWORK` · `REJECT` — laisser vide tant que non examiné.

---

## A1 — PMP (`d19m_draft_pmp`)

**Objectif :** scorecard sans biais outils / fréquence de reporting ; focus efficacité et résultats ; pas de fausse certification PMI.

| Type | Critères |
|------|----------|
| Déterministes | JSON/Zod OK ; version **1.3.1** ; `draft_suggestion` ; limites questions/catégories ; pas de clés d’effet de bord ; pas de certification PMI officielle (sous-chaînes interdites) |
| Qualitatifs humains | Questions orientées efficacité / utilité décisionnelle ; pas de score « plus fréquent = mieux » ; outil non traité comme preuve de maturité |
| Défauts bloquants | Biais fréquence/outil dominant ; fausse reconnaissance PMI ; collecte hors sujet ; structure inutilisable |

| Champ | Valeur |
|-------|--------|
| Justification de décision |  |
| Décision (`OK` / `REWORK` / `REJECT`) |  |
| Reviewer / date |  |

---

## A2 — PMO (`d19m_draft_pmo`)

**Objectif :** maturité centrée décisions / résultats / gouvernance adaptée ; pas d’autonomie max ni d’automatisation comme finalité ; pas de contacts.

| Type | Critères |
|------|----------|
| Déterministes | Zod OK ; v1.3.1 ; tailles OK ; pas de questions contact non sollicitées |
| Qualitatifs humains | Valeur / arbitrage / priorisation ; automatisation = moyen ; autonomie contextualisée |
| Défauts bloquants | Bonus systématique autonomie max ou automatisation ; e-mail/téléphone non demandés |

| Champ | Valeur |
|-------|--------|
| Justification de décision |  |
| Décision (`OK` / `REWORK` / `REJECT`) |  |
| Reviewer / date |  |

---

## A3 — B2B (`d19m_draft_prospects`)

**Objectif :** qualification sans bonus injustifié pour la seule présence de contraintes ; pas de collecte e-mail/téléphone automatique.

| Type | Critères |
|------|----------|
| Déterministes | Zod OK ; v1.3.1 ; pas de contact non sollicité |
| Qualitatifs humains | Distinction besoin / contraintes / adéquation ; scores cohérents avec la pertinence du prospect |
| Défauts bloquants | Points automatiques pour « a des contraintes sécu » ; collecte coordonnées |

| Champ | Valeur |
|-------|--------|
| Justification de décision |  |
| Décision (`OK` / `REWORK` / `REJECT`) |  |
| Reviewer / date |  |

---

## A4 — Ambiguïté (`d19m_draft_ambiguous`)

**Objectif :** clarification pertinente ; aucune scorecard créée.

| Type | Critères |
|------|----------|
| Déterministes | `status=needs_clarification` ; question de clarification présente ; pas de corps draft ; version 1.3.1 |
| Qualitatifs humains | Question claire (leadership / ventes / hybride ou équivalent) ; pas de choix arbitraire imposé |
| Défauts bloquants | Draft généré malgré ambiguïté ; clarification hors sujet |

| Champ | Valeur |
|-------|--------|
| Justification de décision |  |
| Décision (`OK` / `REWORK` / `REJECT`) |  |
| Reviewer / date |  |

---

## B2 — Analyse score élevé (`d19m_analyze_high`)

**Objectif :** intégrité des scores 88 / 92 / 85 / 87 ; prudence ; faits ≠ interprétations.

| Type | Critères |
|------|----------|
| Déterministes | Zod OK ; version **1.3.0** ; `officialScoresEcho` = entrée ; pas de recalcul |
| Qualitatifs humains | Écarts 1–4 pts décrits avec prudence ; pas de causes organisationnelles inventées ; limites d’analyse présentes |
| Défauts bloquants | Scores altérés ; inventions de causes ; absence de limites |

| Champ | Valeur |
|-------|--------|
| Justification de décision |  |
| Décision (`OK` / `REWORK` / `REJECT`) |  |
| Reviewer / date |  |

---

## C1 — Compétences / budget limité (`d19m_plan_skills`)

**Objectif :** budget limité ≠ arbitrage forcé ; plan compatible 3 h/semaine.

| Type | Critères |
|------|----------|
| Déterministes | Zod OK ; v1.3.1 ; `requiresArbitration=false` (sauf nouvelle contrainte exclusive explicite) ; faits / hypothèses présents ; horizons cohérents |
| Qualitatifs humains | Actions réalistes sous 3 h/sem ; budget limité non transformé en budget exclusif ; pas d’hypothèses présentées comme faits |
| Défauts bloquants | Arbitrage injustifié ; charge irréaliste ; % garantis |

| Champ | Valeur |
|-------|--------|
| Justification de décision |  |
| Décision (`OK` / `REWORK` / `REJECT`) |  |
| Reviewer / date |  |

---

## C2 — PMO / pas de nouvel outil (`d19m_plan_pmo`)

**Objectif :** pas d’outil imposé ; cibles chiffrées **à valider** ; réaliste pour 3 personnes.

| Type | Critères |
|------|----------|
| Déterministes | Zod OK ; v1.3.1 ; pas d’arbitrage exclusif forcé à tort ; % non validés rejetés côté runner si nus |
| Qualitatifs humains | Respect « pas de nouvel outil » ; charge 3 personnes ; délais cohérents |
| Défauts bloquants | Nouvel outil imposé ; % présentés comme validés ; plan irréaliste |

| Champ | Valeur |
|-------|--------|
| Justification de décision |  |
| Décision (`OK` / `REWORK` / `REJECT`) |  |
| Reviewer / date |  |

---

## C4 — Arbitrage exclusif (`d19m_plan_competing`)

**Objectif :** budget unique / un seul chantier → arbitrage obligatoire ; pas de choix imposé par l’IA.

| Type | Critères |
|------|----------|
| Déterministes | Zod OK ; v1.3.1 ; `requiresArbitration=true` ; question d’arbitrage présente |
| Qualitatifs humains | Conflit reconnu ; plans conditionnels ; aucun résultat garanti ; pas de décision exclusive arbitraire |
| Défauts bloquants | Pas d’arbitrage ; choix unique décidé par l’IA ; garanties inventées |

| Champ | Valeur |
|-------|--------|
| Justification de décision |  |
| Décision (`OK` / `REWORK` / `REJECT`) |  |
| Reviewer / date |  |

---

## Synthèse 8 scénarios LIVE (après revue)

| Compteur | Valeur |
|----------|--------|
| OK | *(à calculer après revue)* |
| REWORK |  |
| REJECT |  |
| Non examinés | **8** tant que LIVE non exécuté / non relu |
| HUMAN REVIEW LIVE | **PENDING** |
