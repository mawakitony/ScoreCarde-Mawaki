# LOT 19 — Audit Assistant IA actuel (WOLOYEM Score)

**Date:** 2026-10-23  
**Périmètre:** lecture seule — aucun fichier de production modifié dans cette phase.

---

## 1. Architecture

```
UI (assistant-view + animated-ai-robot)
  → actions/assistant.ts (Server Actions, session + membership)
    → lib/ai/agent/runtime.ts (runAssistantTurn)
      → security.ts (injection / forbidden / redact)
      → provider.ts (OpenAI-compatible chat JSON)
      → schemas + normalize (sortie structurée)
      → tools/plan + tools/execute + tools/policy
        → reads.ts / writes.ts (données tenant)
```

| Couche | Fichiers clés |
|--------|----------------|
| UI | `components/assistant/assistant-view.tsx`, `animated-ai-robot.tsx` |
| Actions | `actions/assistant.ts` |
| Runtime | `lib/ai/agent/runtime.ts`, `normalize.ts`, `present.ts`, `limits.ts` |
| Sécurité | `lib/ai/agent/security.ts` |
| Schémas | `lib/ai/agent/schemas.ts` |
| Tools | `lib/ai/tools/{policy,plan,execute,reads,writes}.ts` |
| Provider | `lib/ai/provider.ts` |
| Reports (séparé) | `lib/ai/prompts.ts` + `generateReportAnalysis` |

---

## 2. Fournisseur LLM

- Interface `AIProvider` dans `lib/ai/provider.ts`.
- Config via `AI_API_KEY`, `AI_PROVIDER`, `AI_BASE_URL`, `AI_MODEL`.
- Appels HTTP OpenAI-compatible `/chat/completions` avec `response_format: json_object`.
- Temperature `0.2`, retries 429/5xx, timeout agent ~45s (`AGENT_LIMITS.providerTimeoutMs`).
- Pas de SDK vendor hardcodé — compatible Groq / OpenAI / proxies.

---

## 3. Protocole de sortie

- JSON unique validé par `assistantLlmResponseSchema` :
  - `intent`, `mode`, `message`, `tools[]` (`tool`, `arguments`, `summary`), `requiresConfirmation`, `diffs`.
- Normalisation OpenAI-style `name/parameters` → `tool/arguments` (`normalize.ts`).
- `message` destiné à l’humain (humanisation LOT 18 via `present.ts`).

---

## 4. Prompts système

- Prompt système inline dans `runtime.ts` (copilote FR, tools whitelist, modes advise/prepare/execute).
- Données applicatives wrappées `_untrusted: true` (`wrapUntrustedData`).
- Reports : `AI_GUARDRAILS` + `sanitizeAiAnalysis` dans `prompts.ts` (pipeline séparé).

---

## 5. Système de tools

**Lecture :** `list_scorecards`, `get_scorecard`, `list_questions`, `search_leads`, `get_lead`, métriques, analytics, report summary.

**Écriture (proposition → confirmation) :** `create_scorecard_draft`, `update_scorecard_draft`, questions/catégories/scoring/ranges, tags/statut leads.

**Interdit au niveau agent :** publish, delete, anonymize, billing/Stripe, domains, API keys, platform, transfer ownership.

---

## 6. Validation des arguments

- Zod par tool (`toolArgsSchemas` dans `schemas.ts`).
- Types de questions alignés Builder (`single_choice`, `scale_5`, …).
- Limites : max tools/turn, questions, catégories, historique (`limits.ts`).
- Plans construits via `buildExecutionPlan` — tools inconnus rejetés.

---

## 7. Protections écritures non confirmées

- Modes : `advise` (read-only), `prepare` / `execute` (écritures proposées avec `requiresConfirmation=true`).
- Application réelle uniquement via `applyAssistantPlan` après confirmation UI.
- Status implicite draft pour `create_scorecard_draft` (pas de publish via tool).

---

## 8. Permissions & tenant

- `ensureMembership` + `getUser` sur les Server Actions.
- `canUseTool(role, tool)` mappe vers `lib/auth/permissions` (`scorecard.edit`, `lead.read`, …).
- Quota / feature flag billing : `hasFeature(..., "ai")`, `ai_generations`.
- Contexte org passé explicitement (`organizationId`) — pas de cross-tenant côté tools prévus.

---

## 9. Erreurs & coûts

- Provider non configuré → message clair, pas d’appel.
- Quota dépassé → refus.
- Injection / actions interdites → `ASSISTANT_UNAVAILABLE`.
- Coût : 1 génération comptabilisée via `consumeMonthly` (métrique billing), pas de pricing token exposé dans le code.

---

## 10. Tests existants

- `lib/ai/agent/agent.test.ts` — schéma, normalize, permissions, confirmation, injection.
- `lot6-guardrails.test.ts`
- `lot18-assistant-ux.test.ts`
- `lot18a-visual-qa.test.ts`
- Pas de tests LIVE LLM obligatoires en CI.

---

## 11. Points de réutilisation pour Fabric-prototype

| Réutiliser | Ne pas coupler |
|------------|----------------|
| Philosophie sortie JSON + Zod | `runtime.ts` / tools d’écriture |
| Types questions Builder | `actions/assistant.ts` |
| Idées security (redact, injection heuristics) | UI robot / assistant-view |
| Style adaptateur `generateChatJson` | Quotas / billing (prototype isolé) |

---

## 12. Risques (état actuel)

1. Prompt injection partiellement heuristique — Zod + policy restent la vraie frontière.
2. Dépendance provider externe et quotas.
3. Outils d’écriture puissants si confirmation UI contournée (mitigé par Server Action + plan schema).
4. Confusion future si un second moteur Patterns appelle les mêmes writes sans garde-fous.

**Conclusion:** l’agent production est mature pour le copilote ; le prototype Fabric doit rester **hors** de ce chemin d’exécution.
