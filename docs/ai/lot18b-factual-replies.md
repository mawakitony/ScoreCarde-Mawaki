# LOT 18B — Réponses factuelles et exploitation des données

**Date:** 2026-10-24  
**QA authentifié live:** non exécuté dans ce lot → READY FOR MANUAL QA

## 1. Cause racine

Le LLM produit un `message` **avant** l’exécution des tools de lecture.  
`runAssistantTurn` exécutait ensuite les tools, peuplait `readResults`, mais renvoyait **tel quel** `response.message` (ex. « Voici le nombre… », « Je récupère… ») **sans** y injecter les valeurs (`leads: 19`, `conversionRate: 51.6`).

- Ce n’était pas `sanitizeAssistantMessage` qui effaçait les chiffres.
- L’UI affichait correctement le message assistant (mauvais contenu) ; les valeurs n’apparaissaient que dans l’Espace de travail via `presentReadResult`.
- Aucune seconde génération LLM après lecture.

## 2. Fichiers modifiés

- `lib/ai/agent/factual-reply.ts` (nouveau)
- `lib/ai/agent/runtime.ts`
- `lib/ai/agent/present.ts`
- `lib/ai/agent/lot18b-factual-replies.test.ts` (nouveau)
- `package.json` (script test)
- `docs/ai/lot18b-factual-replies.md`

## 3. Correction du pipeline

Après lectures réussies (et sans plan d’écriture) :

`finalizeAssistantReply` → synthèse déterministe de la métrique demandée à partir de `readResults` → message final avec la valeur.

## 4. Avant / après

| Question | Avant | Après |
|----------|-------|-------|
| Nombre de leads (19) | « Voici le nombre total de leads… » | « Vous avez actuellement 19 leads dans votre compte. » |
| Taux de conversion (51.6) | « Je récupère votre taux… » | « Votre taux de conversion actuel est de 51,6 %. » |
| Score moyen (55.4) | Vague / sans chiffre | « Votre score moyen est de 55,4, selon l'unité… » (sans % inventé) |

## 5. Tests

`lib/ai/agent/lot18b-factual-replies.test.ts` — leads, conversion, score moyen, zéro, null, erreur outil, plan d’écriture non écrasé, progression, labels workspace.

## 6. Sécurité

- Valeurs uniquement depuis tools déjà scoped org/role.
- Pas de second tenant, pas de Fabric, pas de writes auto.
- Confirmations d’écriture préservées (`hasWritePlan` → pas de remplacement).

## 7. Limites

- Synthèse déterministe pour métriques dashboard simples ; analyses complexes restent sur le LLM.
- QA manuelle authentifiée encore nécessaire.
- Patterns Fabric non intégrés.

## 8. Vérifications manuelles

1. « Donne-moi le nombre total de leads » → chiffre dans la bulle.
2. « Quel est mon taux de conversion ? » → xx,x % dans la bulle.
3. Compte à 0 lead → « 0 leads ».
4. Mode Préparer + création → message de plan non remplacé à tort.
5. Robot / thèmes / confirmations inchangés.

## Statuts

| Item | Status |
|------|--------|
| TOOL RESULT HANDLING | **PASS** (code) |
| FINAL ANSWER GENERATION | **PASS** (tests) |
| METRIC ACCURACY | **PASS** (tests fixtures) |
| ZERO AND NULL HANDLING | **PASS** |
| SECURITY | **PASS** |
| NON-REGRESSION | **PASS** (suite agent) |
| **OVERALL** | **READY FOR MANUAL QA** |
