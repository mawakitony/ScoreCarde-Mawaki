# LOT 19I — Plan de retest ciblé (Patterns v1.3.0)

**Statut :** PREPARED_NOT_RUN  
**LIVE LLM CALLS (ce document) :** **ZERO** — préparation uniquement  
**Autorisation requise avant exécution :** confirmation explicite dans un nouveau message + variables d’env dédiées (à créer au moment du run, ex. `FABRIC_EVAL_CONFIRM_19I=I_AUTHORIZE_LOT19I_LIVE`)  
**Ne pas exécuter sans autorisation.**

Candidate version pour les 12 scénarios : **1.3.0** (les trois Patterns).

Tarifs de référence (Groq `openai/gpt-oss-120b`, snapshot LOT 19F) : ~$0.15 / M tokens in, ~$0.60 / M tokens out.

---

## Budget prévisionnel

| Item | Valeur |
|------|--------|
| Scénarios | 12 (4 + 4 + 4) |
| Plafond HTTP suggéré | **18** (12 succès + marge 429/retry) |
| Spacing TPM suggéré | ≥ 4 s ; TPM limit ~8000 |
| Tokens estimés / appel | ~900–2000 in + ~700–2000 out |
| Coût bas | **~$0.004** |
| Coût haut | **~$0.02** |
| Appels max | **18** |

---

## A — Scorecard draft (4)

### A1 — PMP compétences

| Champ | Contenu |
|-------|---------|
| Objectif | Vérifier questions métier mesurables, échelles explicites, pas de certification PMI |
| Entrée | Description PMP / gestion de projet, `maxQuestions=12`, `maxCategories=4`, locale `fr` |
| Critères d’acceptation | `status=draft_suggestion` ; ≥3 questions liées planification/risques/suivi ; scale avec signification 1/max ; 0 promesse PMI/ISO ; ≤ max* |
| Version | 1.3.0 |
| Risques | Questions génériques ; options vagues |
| Contrôles auto | Zod draft_suggestion ; maxQuestions/Categories ; forbidden « certification officielle PMI » |
| Revue humaine | Pertinence métier ; pas de doublons ; cohérence catégories |

### A2 — PMO maturité

| Champ | Contenu |
|-------|---------|
| Objectif | Aucune collecte e-mail / téléphone ; maturité organisationnelle |
| Entrée | Diagnostic maturité PMO direction projets (fictif) |
| Critères | Pas de type `email`/`phone` ; pas de titre demandant un contact ; catégories gouvernance/livraison/reporting |
| Version | 1.3.0 |
| Risques | Réapparition question e-mail (défaut 19H) |
| Contrôles auto | Garde contact ; Zod |
| Revue humaine | Hors-sujet contact = FAIL |

### A3 — Prospects B2B

| Champ | Contenu |
|-------|---------|
| Objectif | Qualification commerciale claire sans confusion CRM / décideur email |
| Entrée | Qualification prospects B2B mid-market (fictif) |
| Critères | Questions besoin / urgence / maturité d’achat / fit ; contribution au diagnostic explicite |
| Version | 1.3.0 |
| Risques | Mélange identification décideur + scoring |
| Contrôles auto | Zod ; anti-contact sauf besoin explicite |
| Revue humaine | Chaque question sert le diagnostic |

### A4 — Ambigu leadership ou ventes

| Champ | Contenu |
|-------|---------|
| Objectif | Clarification au lieu d’un hybride arbitraire |
| Entrée | « Je voudrais quelque chose sur le leadership ou les ventes. » |
| Critères | `status=needs_clarification` ; `clarifyingQuestion` claire ; **aucune** persistence ; pas de `questions` |
| Version | 1.3.0 |
| Risques | Draft hybride malgré prompt |
| Contrôles auto | Zod branch clarification ; absence questions |
| Revue humaine | Question d’arbitrage compréhensible |

---

## B — Analyze results (4)

### B1 — Score faible + échantillon 1

| Champ | Contenu |
|-------|---------|
| Objectif | Prudence, limites explicites, echo exact |
| Entrée | global ~27–28 %, catégories basses, `respondentCount=1` |
| Critères | Echo = input ; `facts` citent les % ; `analysisLimits` mentionne échantillon ; pas de causes inventées |
| Version | 1.3.0 |
| Risques | Sur-généralisation |
| Contrôles auto | scoring_integrity 100 % |
| Revue humaine | Ton proportionné |

### B2 — Score élevé + petits écarts

| Champ | Contenu |
|-------|---------|
| Objectif | Ne pas forcer des axes d’amélioration sur écarts &lt;5 pts |
| Entrée | global ~88 %, catégories 85–92 % |
| Critères | Pas d’amélioration artificielle ; facts/interpretations distincts |
| Version | 1.3.0 |
| Risques | Sur-interprétation (défaut 19H high) |
| Contrôles auto | Echo ; Zod |
| Revue humaine | Nuance sur écarts faibles |

### B3 — Déséquilibré

| Champ | Contenu |
|-------|---------|
| Objectif | Expliquer l’amplitude sans inventer la cause |
| Entrée | Une catégorie ~95 %, une ~15–25 % |
| Critères | Écart décrit ; interprétations prudentes ; reco proportionnées |
| Version | 1.3.0 |
| Risques | Causalités inventées |
| Contrôles auto | Echo |
| Revue humaine | Séparation faits / interprétations |

### B4 — Partiel / une catégorie / sans seuils

| Champ | Contenu |
|-------|---------|
| Objectif | Signaler données insuffisantes |
| Entrée | Une catégorie, `thresholds=[]`, notes partielles |
| Critères | `analysisLimits` explicites ; strengths/amélioration peuvent être vides |
| Version | 1.3.0 |
| Risques | Analyse trop assertive |
| Contrôles auto | Echo ; Zod |
| Revue humaine | Limites visibles |

---

## C — Action plan (4)

### C1 — Compétences / risques / communication

| Champ | Contenu |
|-------|---------|
| Objectif | Actions concrètes, indicateurs observables, pas de % garantis |
| Entrée | Lacunes risques / communication / planification (fictif) |
| Critères | ≥3 actions liées ; `facts`/`hypotheses` ; 0 formulation « réduira de X % » garantie |
| Version | 1.3.0 |
| Risques | Objectifs chiffrés arbitraires (défaut 19H) |
| Contrôles auto | Garde % ; 3 priorités ; Zod |
| Revue humaine | Exploitabilité |

### C2 — PMO reporting vs décision

| Champ | Contenu |
|-------|---------|
| Objectif | Respect contraintes « pas de nouvel outil » ; concision |
| Entrée | Trop de reporting, peu d’indicateurs décisionnels |
| Critères | Pas d’outil inventé ; missingInformation si baseline absente |
| Version | 1.3.0 |
| Risques | Plan irréaliste |
| Contrôles auto | Zod ; garde % |
| Revue humaine | Alignement contraintes |

### C3 — Digital adoption

| Champ | Contenu |
|-------|---------|
| Objectif | Plan progressif sans recrutement inventé |
| Entrée | Adoption inégale + coordination (fictif) |
| Critères | Horizons réalistes ; pas de garantie de résultat |
| Version | 1.3.0 |
| Risques | Actions génériques |
| Contrôles auto | Zod |
| Revue humaine | Lien aux écarts fournis |

### C4 — Priorités concurrentes / budget unique

| Champ | Contenu |
|-------|---------|
| Objectif | Arbitrage, pas de choix arbitraire du chantier unique |
| Entrée | Plusieurs gaps + « Budget unique pour un seul chantier majeur » |
| Critères | `requiresArbitration=true` ; `arbitrationQuestion` ; comparaison d’options ; **aucune** dépense engagée |
| Version | 1.3.0 |
| Risques | Choix unilatéral d’un projet |
| Contrôles auto | mustRequireArbitration |
| Revue humaine | Grille de décision / confirmation demandée |

---

## Protocole d’exécution (quand autorisé)

1. Confirmer explicitement le retest LOT 19I dans le chat.
2. Poser les flags Fabric eval + confirm 19I (sans activer l’UI production).
3. Exécuter uniquement les 12 scénarios ci-dessus (mock préflight d’abord).
4. Persister sorties sous `tmp/lot19i-live/` avec **version 1.3.0** réelle — ne pas réécrire 19D/19F.
5. Remplir une grille humaine séparée (ne pas écraser `lot19g-human-review.csv` sans consigne).
6. Décision CANDIDATE uniquement après revue humaine COMPLETED.

---

## Hors scope

- Intégration WOLOYEM AI  
- LOT 20  
- Déploiement / migrations / feature flags prod  
- Relabel des artefacts LIVE 1.2.x  
