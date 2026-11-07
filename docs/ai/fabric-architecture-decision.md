# LOT 19 — Décision d’architecture Fabric × WOLOYEM Score

**Date:** 2026-10-23  
**Décision:** **Option A — Patterns TypeScript adaptés**, exécutés via adaptateur LLM injectable (mock par défaut).

---

## Options comparées

### Option A — Patterns TS locaux (retenue)

| Critère | Évaluation |
|---------|------------|
| Infra | Réutilise Zod + conventions repo ; adaptateur compatible `AI_*` plus tard |
| Vercel | Aucun binaire Go ; serverless-friendly |
| Contrôle sortie | Schémas Zod stricts par Pattern |
| Sécurité | Read-only ; pas d’actions métier ; flags off par défaut |
| Tests | Mock déterministe sans clé API |
| Ops | Aucun service supplémentaire |

### Option B — Serveur Fabric séparé

| Critère | Évaluation |
|---------|------------|
| Hébergement | VM/container Go permanent (pas idéal serverless) |
| Auth | API key Fabric ≠ auth Supabase / rôles Score |
| Latence | Hop réseau supplémentaire |
| Confidentialité | Sessions/contexts filesystem ; risque de mélange tenants |
| Maintenance | Suivi releases Go (v1.4.x rapide) |
| LOT 19 | **Non déployé** |

### Option C — Hybride

Patterns locaux pour le cœur Score ; Fabric serveur pour niches (YouTube, etc.).  
**Différé** : complexité injustifiée tant que A n’est pas validé en qualité LIVE.

---

## Justification Option A

1. Fabric n’est pas un SDK TS — l’intérêt est la **philosophie Patterns**, pas le runtime.
2. WOLOYEM a déjà un provider OpenAI-compatible et des garde-fous agent.
3. Les 3 use cases (draft, analyse, plan) exigent **JSON métier + Zod**, absents de Fabric natif.
4. Isolation totale de l’Assistant LOT 18 / 18A.
5. Coût / risque / time-to-prototype minimaux.

---

## Diagramme des flux (prototype)

```
Caller (tests / futur lab uniquement)
  │
  ▼
flags: FABRIC_PROTOTYPE_ENABLED (default OFF)
  │
  ▼
runPattern(id, input, { adapter })
  │
  ├─ security: size, injection heuristics, strip side-effect fields
  ├─ Zod input
  ├─ build system + user messages (Pattern)
  ├─ adapter.completeJson (MOCK | LIVE gated)
  ├─ Zod output + strip unauthorized actions
  └─ metrics (latency, pattern id, ok/error) — pas de PII
```

**Frontières de sécurité**

- Aucun import de `lib/ai/tools/writes` ni Server Actions métier.
- Aucun accès Supabase dans le moteur.
- LIVE interdit sauf `FABRIC_PROTOTYPE_LIVE=1` + enabled + autorisation humaine.
- CI = mock uniquement.

---

## Plan de passage ultérieur (hors LOT 19)

1. Évaluation LIVE sur fixtures synthétiques.
2. Mapping draft → UI Builder (toujours confirmation utilisateur).
3. Éventuelle surface « Lab » dashboard, jamais dans le chat production sans lot dédié.
4. Reconsidérer Option C seulement si un besoin non couvert par A apparaît.

---

## Statut

**ARCHITECTURE DECISION: PASS (Option A)**
