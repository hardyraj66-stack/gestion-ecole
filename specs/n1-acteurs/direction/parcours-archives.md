<a id="PA-DIR-005"></a>
# PA-DIR-005 — Consulter les archives

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Direction](_index.md)
> **Domaine fonctionnel** : Années scolaires / Mode archive

---

## Objectif

Accéder en lecture seule aux données d'une année scolaire passée. Toutes les pages de l'application fonctionnent en mode archive, mais aucune modification n'est possible.

---

## Parcours — Entrer en mode archive

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Année scolaire → section Archives | — | [PAGE-ANN-001](../../n2b-ihm/annee-scolaire/page-annee-scolaire.md) |
| 2 | Cliquer "Consulter" sur l'année souhaitée | UC-ANN-004 | — |
| 3 | Le système charge le snapshot de l'année | UC-ANN-004 | — |
| 4 | Un bandeau orange s'affiche : "Mode consultation — Année XXXX-XXXX — Données en lecture seule" | — | — |
| 5 | Naviguer librement : classes, élèves, bulletins, planning — tout en lecture seule | — | — |
| 6 | Cliquer "Quitter" dans le bandeau pour revenir au mode live | UC-ANN-005 | — |

## Résultat

Toutes les données de l'année archivée consultables. Bulletins de l'année accessibles pour chaque élève.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Aucune archive disponible | Section Archives vide |
| Tentative d'écriture en mode archive | Boutons d'action masqués ou désactivés |
