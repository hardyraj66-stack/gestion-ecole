<a id="PA-DIR-006"></a>
# PA-DIR-006 — Consulter le tableau de bord

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Direction](_index.md)
> **Domaine fonctionnel** : Dashboard

---

## Références

| Type | Lien |
|------|------|
| Pages IHM | [n2b-ihm/dashboard/_index.md](../../n2b-ihm/dashboard/_index.md) |
| BC Données | [bc-classes/_index.md](../../n2a-domaine/bc-classes/_index.md), [bc-eleves/_index.md](../../n2a-domaine/bc-eleves/_index.md) |

---

## Objectif

Obtenir une vue synthétique de l'établissement en un coup d'œil : effectifs, statistiques d'absences, convocations en attente, et aperçu des classes.

---

## Parcours — Consulter le tableau de bord

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers l'accueil / Dashboard | — | [PAGE-DASH-001](../../n2b-ihm/dashboard/page-dashboard.md) |
| 2 | Lire les cartes statistiques : nb classes, nb élèves, nb absences du jour, nb convocations en attente | — | — |
| 3 | Consulter le tableau des classes avec effectifs et moyennes | — | — |
| 4 | Consulter le widget Convocations : élèves convoqués avec motif | — | — |
| 5 | Cliquer sur une classe → naviguer vers la page détail de la classe | — | — |

## Résultat

Vision rapide de l'état de l'établissement. Alertes visuelles sur les convocations non traitées.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Aucune donnée (première utilisation) | Cartes affichent 0, tableau vide avec message d'accueil |
| Mode archive | Dashboard affiche les données de l'année archivée avec bandeau orange |
