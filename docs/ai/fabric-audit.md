# LOT 19 — Audit Fabric

**Date:** 2026-10-23  
**Source:** [danielmiessler/Fabric](https://github.com/danielmiessler/Fabric)  
**Version analysée:** release **v1.4.553** (tag GitHub, publié 2026-10-23)  
**Licence:** MIT (métadonnées GitHub `license.spdx_id = MIT`)

---

## 1. Présentation de Fabric

Fabric est un framework open-source d’**augmentation humaine via l’IA**, centré sur l’organisation de prompts réutilisables appelés **Patterns**.

Ce n’est **pas** une bibliothèque TypeScript npm pour Next.js. C’est principalement :

- un **binaire / CLI Go** (`cmd/fabric`) ;
- un catalogue de **patterns Markdown** (`data/patterns/*/system.md`) ;
- un orchestrateur **Chatter** ;
- des **plugins vendors** (OpenAI, Anthropic, Gemini, Ollama, Azure, etc.) ;
- un stockage filesystem (`~/.config/fabric` : patterns, contexts, sessions) ;
- un **serveur REST** optionnel (`fabric --serve`, Swagger) ;
- des stratégies de prompting (CoT, ToT, self-refine, …).

Philosophie : l’IA a un problème d’**intégration**, pas de capacité — le Pattern est l’unité atomique.

---

## 2. Version / commit analysé

| Élément | Valeur |
|--------|--------|
| Repo | `danielmiessler/Fabric` |
| Branche | `main` |
| Release consultée | **v1.4.553** |
| Langage principal | **Go** |
| Stars (API GitHub) | ~44k |
| Analyse | README officiel, architecture DeepWiki, API releases, LICENSE MIT |

Aucun clone local ni exécution de scripts Fabric n’a été réalisé (contrainte LOT 19).

---

## 3. Patterns pertinents (conceptuels)

Patterns Fabric natifs **inspirants** (catalogue public `data/patterns/`), non couplés au métier Score :

| Pattern Fabric (exemples) | Intérêt conceptuel WOLOYEM |
|---------------------------|----------------------------|
| `summarize` | Synthèse de résultats / briefs |
| `analyze_claims` | Distinguer faits / hypothèses |
| `extract_wisdom` | Extraire priorités actionnables |
| `create_quiz` / patterns éducatifs | Structure Q/R (à adapter) |
| `analyze_code` | N/A métier Score |
| WELLNESS / concept maps | Hors scope SaaS multi-tenant |

**À construire côté WOLOYEM (personnalisé, pas natif Fabric) :**

1. `generate_scorecard_draft`
2. `analyze_scorecard_results`
3. `generate_action_plan`

---

## 4. Avantages

- Catalogue de prompts structurés, lisibles, versionnables.
- Séparation claire Pattern / vendor / session.
- REST API + mode dry-run / print-prompt utiles pour l’introspection.
- Licence MIT permissive.
- Communauté large ; patterns réutilisables hors runtime Fabric (« Just use the Patterns »).
- Multi-providers mature côté CLI.

---

## 5. Limites

- **Pas un SDK TypeScript** importable dans l’App Router.
- Runtime Go + filesystem — peu adapté à **Vercel serverless** sans service dédié.
- Patterns Markdown = texte libre ; **pas de Zod / JSON schema natif** pour un SaaS strict.
- Pas de notion native de **tenant**, RLS, permissions WOLOYEM, confirmations d’écriture.
- Serveur REST = surface d’attaque et ops supplémentaires (auth API key, CORS, secrets).
- Extensions / tools locaux (YouTube, Jina, coding) hors périmètre Score et risqués en prod.
- Licence file upstream parfois générique MIT ; obligations = conserver notice MIT si on copie du contenu.

---

## 6. Compatibilité avec WOLOYEM Score

| Critère | Compatibilité |
|---------|----------------|
| Next.js 16 / Vercel | Faible si runtime Fabric ; **forte** si on réutilise seulement la *philosophie* Patterns |
| Agent actuel (`lib/ai/agent/*`) | Compatible via adaptateur LLM déjà présent (`AI_*`) |
| Sortie structurée Zod | À ajouter (custom) |
| Multi-tenant / confirmations | Hors Fabric — rester sur nos garde-fous |
| Déploiement sans service Go | Oui via Option A |

---

## 7. Risques

1. **Confusion produit** : intégrer Fabric CLI en prod = dette ops + latence + fuite de secrets.
2. **Prompt seul ≠ sécurité** : les patterns Markdown ne remplacent pas Zod + policy + confirmation.
3. **Fuite tenant** si un serveur Fabric partagé mélange sessions/contexts.
4. **Coûts LLM** non contrôlés si patterns verbose sans limites.
5. **Dépendance upstream** si on fork le serveur Go.
6. Exécution de scripts inconnus du repo — **interdite** dans ce lot.

---

## 8. Recommandation d’architecture

**Réutiliser conceptuellement Fabric (Patterns versionnés + instructions système claires), sans installer le serveur Fabric.**

Implémenter un moteur TypeScript isolé dans `lib/ai/fabric-prototype/` (Option A), mocké par défaut, sans toucher l’Assistant de production.

Voir `docs/ai/fabric-architecture-decision.md`.

### Natif Fabric vs custom WOLOYEM

| Natif Fabric | Custom WOLOYEM (LOT 19) |
|--------------|-------------------------|
| CLI Go, Chatter, vendors | Runner TS + adaptateur injectable |
| Patterns Markdown | Patterns TS + Zod in/out |
| Sessions filesystem | Aucune persistence prod |
| REST `--serve` | Non déployé |
| Stratégies CoT/ToT | Non requis pour le prototype |
| Catalogue crowdsourcé | 3 patterns métier Score |

---

## Références

- https://github.com/danielmiessler/Fabric
- https://github.com/danielmiessler/Fabric/releases/tag/v1.4.553
- https://deepwiki.com/danielmiessler/Fabric
