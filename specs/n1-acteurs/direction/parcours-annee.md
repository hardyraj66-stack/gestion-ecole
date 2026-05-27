<a id="PA-DIR-004"></a>
# PA-DIR-004 — Gérer le cycle de l'année scolaire

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Direction](_index.md)
> **Domaine fonctionnel** : Années scolaires

---

## Références

| Type | Lien |
|------|------|
| BC Années | [bc-annees/_index.md](../../n2a-domaine/bc-annees/_index.md) |
| Pages IHM | [n2b-ihm/annee-scolaire/_index.md](../../n2b-ihm/annee-scolaire/_index.md) |

---

## Cycle de vie

```
En préparation  →  Active  →  Terminée
```

## Parcours 1 — Préparer une nouvelle année

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Année scolaire | — | [PAGE-ANN-001](../../n2b-ihm/annee-scolaire/page-annee-scolaire.md) |
| 2 | Cliquer "Préparer une nouvelle année" | UC-ANN-001 | — |
| 3 | Saisir le label (ex: "2025-2026"), les dates de début et de fin | UC-ANN-001 | — |
| 4 | Valider → année créée en statut "En préparation" | UC-ANN-001 | — |

## Parcours 2 — Démarrer une année

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la page Année scolaire, repérer l'année en préparation | — | — |
| 2 | Cliquer "Démarrer l'année" | UC-ANN-002 | — |
| 3 | Confirmer dans la boîte de dialogue | UC-ANN-002 | — |
| 4 | L'année passe en "Active". L'éventuelle ancienne active passe en "Terminée" | UC-ANN-002 | — |

> ⚠️ Action irréversible. Vérifier que les classes et matières sont configurées avant de démarrer.

## Parcours 3 — Clôturer une année

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Cliquer "Clôturer l'année" sur l'année active | UC-ANN-003 | — |
| 2 | Confirmer (action irréversible) | UC-ANN-003 | — |
| 3 | L'année passe en "Terminée" et rejoint les archives | UC-ANN-003 | — |

## Résultat

Cycle annuel complet avec traçabilité de chaque action dans l'historique.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Tentative de créer une 2e année "en préparation" | Bloqué — une seule en préparation à la fois |
| Tentative de démarrer sans année en préparation | Bouton masqué |
