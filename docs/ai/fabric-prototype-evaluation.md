# LOT 19 — Évaluation du prototype Fabric

**Date:** 2026-10-23  
**Mode évalué:** MOCK déterministe uniquement  
**LIVE LLM:** NOT RUN (interdit dans ce lot)

---

## 1. Méthode

| Couche | Description |
|--------|-------------|
| Tests déterministes | `lib/ai/fabric-prototype/tests/lot19-fabric-prototype.test.ts` |
| Fixtures | `fixtures/mock-responses.ts` (synthétiques) |
| Qualité humaine | Checklist ci-dessous (revue manuelle future) |
| LIVE | Interface `createLiveLlmAdapter` — non exécutée |

**Important :** les mocks ne prouvent **pas** une amélioration de qualité du modèle. Ils prouvent le câblage, Zod, l’isolation et les garde-fous.

---

## 2. Critères par Pattern

### generate_scorecard_draft

| Critère | Mesure mock | Statut |
|---------|-------------|--------|
| Validité schéma | Zod output | PASS (tests) |
| Types Builder | enum questions | PASS |
| Brouillon seul | `status: draft_suggestion` | PASS |
| Pas de certification inventée | disclaimers + consignes | PASS (structure) |
| Cas métier (formation, sales, org, compétences, ambigu) | fixtures | PASS |
| Entrée malveillante | reject | PASS |

### analyze_scorecard_results

| Critère | Mesure mock | Statut |
|---------|-------------|--------|
| Echo scores officiels | forcé depuis l’input | PASS |
| Pas de recalcul | post-condition runner | PASS |
| Limites d’analyse | champ obligatoire | PASS |
| low/medium/high/imbalanced/partial | fixtures | PASS |

### generate_action_plan

| Critère | Mesure mock | Statut |
|---------|-------------|--------|
| 3 priorités | `.length === 3` | PASS |
| 5 use cases | enum | PASS |
| Pas de prix / CRM / garanties | disclaimers + consignes | PASS (structure) |

---

## 3. Stabilité

Les réponses mock sont déterministes pour une même clé de fixture → stabilité élevée en CI.  
Stabilité LIVE : **non mesurée**.

---

## 4. Performance & coûts (estimations, non tarifées)

| Pattern | Appels LLM | Tokens approx. (ordre de grandeur) | Latence attendue LIVE |
|---------|------------|--------------------------------------|------------------------|
| generate_scorecard_draft | 1 | 1.5k–4k in + 1k–3k out | 2–8 s |
| analyze_scorecard_results | 1 | 0.8k–2k in + 0.6k–1.5k out | 1–5 s |
| generate_action_plan | 1 | 0.8k–2k in + 0.8k–2k out | 1–6 s |

- Timeouts : à caler sur `AGENT_LIMITS.providerTimeoutMs` si LIVE branché plus tard.
- Cache : possible par hash d’input **scoped tenant** uniquement — non implémenté (évite fuite cross-tenant).
- Coûts $ : **non inventés** sans modèle/tarif confirmés.

Le prototype n’est pas monté dans l’UI production → **aucun impact perf** runtime actuel.

---

## 5. Checklist évaluation humaine (future)

- [ ] Pertinence métier FR sur 10 descriptions réelles anonymisées
- [ ] Absence d’hallucination de certifications
- [ ] Utilité du plan d’action pour un manager
- [ ] Comparaison mock vs LIVE sur le même jeu

---

## 6. Passage vers intégration réelle (hors LOT 19)

1. Autoriser LIVE sur fixtures lab uniquement.
2. Brancher adaptateur sur `activeAiProvider().generateChatJson` sans tools writes.
3. Surface « Lab » optionnelle + confirmation Builder.
4. Ne pas fusionner dans `assistant-view` sans lot dédié.
