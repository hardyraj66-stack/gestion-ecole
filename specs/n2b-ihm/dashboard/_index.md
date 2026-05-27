# Dashboard — Specs IHM

> **Couche** : N2b — QUOI écrans (domaine : Tableau de bord)
> **Acteur concerné** : [Direction](./../../../n1-acteurs/direction/_index.md), [Secrétariat](./../../../n1-acteurs/secretariat/_index.md)
> **Ce dossier contient** : la page tableau de bord de l'application
> **Ce dossier NE contient PAS** : logique métier (→ N2a), patterns techniques (→ N3)

---

## Vue d'ensemble — Pages

| Page | Description | Route | Statut |
|------|-------------|-------|--------|
| [Tableau de bord](page-dashboard.md) | Vue synthétique de l'établissement | `/` | Rédigé |

---

## Comportement mode archive

En mode archive (`ViewingContext.isViewingArchive = true`), la page affiche les données de l'année archivée. Un bandeau orange « Mode consultation — Année XXXX-XXXX — Données en lecture seule » s'affiche en haut de l'application.
