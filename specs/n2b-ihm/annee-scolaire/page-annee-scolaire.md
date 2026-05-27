<a id="PAGE-ANN-001"></a>
# Gestion de l'année scolaire

> **Couche** : N2b — QUOI écrans (page : Année scolaire)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-ANN-001 à UC-ANN-005](../../n2a-domaine/bc-annees/_index.md)
> **Type de page** : Dashboard de cycle de vie
> **Route** : `/annee-scolaire`
> **Ce fichier contient** : sections active, en préparation, archives, actions
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure visuelle

```
┌──────────────────────────────────────────────────────────────┐
│  Année scolaire                                               │
├──────────────────────────────────────────────────────────────┤
│  ┌─ Année active ───────────────────────────────────────┐    │
│  │  2024-2025  •  Active                                 │    │
│  │  01/09/2024 → 30/06/2025                             │    │
│  │  [Clôturer l'année]                                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─ En préparation ────────────────────────────────────┐     │
│  │  2025-2026  •  En préparation                        │     │
│  │  [Démarrer l'année]                                   │     │
│  └──────────────────────────────────────────────────────┘     │
│  [+ Préparer une nouvelle année]                              │
│                                                               │
│  ┌─ Archives ──────────────────────────────────────────┐     │
│  │  2023-2024  •  Terminée  [Consulter]                │     │
│  │  2022-2023  •  Terminée  [Consulter]                │     │
│  └──────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## Section — Année active

Affiche l'année avec statut `active`.

| Champ | Source |
|-------|--------|
| Label | `annee.label` |
| Dates | `debut → fin` |
| Statut | Badge « Active » (vert) |

**Actions** :
- [Clôturer l'année] → Confirmation (irréversible) → `POST /annees/:id/terminer`

---

## Section — En préparation

Affiche l'année avec statut `preparation` (une seule possible).

**Actions** :
- [Démarrer l'année] → Confirmation (irréversible) → `POST /annees/:id/demarrer`
- ⚠️ Avertissement : vérifier que les classes et matières sont configurées

---

## Bouton — Préparer une nouvelle année

Affiché si aucune année en préparation n'existe.

Modal de création :
| Champ | Type | Requis |
|-------|------|--------|
| Label | Text | oui (ex: « 2025-2026 ») |
| Date de début | Date | oui |
| Date de fin | Date | oui |

→ `POST /annees`

---

## Section — Archives

Liste des années avec statut `terminee`, triées par date décroissante.

**Actions par archive** :
- [Consulter] → `GET /annees/:id/snapshot` → entre en mode archive (UC-ANN-004)

---

## Mode archive

Quand une archive est consultée :
- `ViewingContext.isViewingArchive = true`
- `ViewingContext.viewingLabel = "2023-2024"`
- Bandeau orange en haut de l'application : « Mode consultation — Année 2023-2024 — Données en lecture seule »
- Bouton [Quitter] dans le bandeau → reset du ViewingContext
