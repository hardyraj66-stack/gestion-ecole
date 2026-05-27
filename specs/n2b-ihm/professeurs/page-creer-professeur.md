<a id="PAGE-PRO-003"></a>
# Créer / Modifier un professeur

> **Couche** : N2b — QUOI écrans (page : Créer un professeur)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-PRO-001](../../n2a-domaine/bc-professeurs/_index.md), [UC-PRO-002](../../n2a-domaine/bc-professeurs/_index.md)
> **Type de page** : Formulaire CRUD
> **Route** : `/professeurs/creer`
> **Ce fichier contient** : champs, validations
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Champs du formulaire

| Champ | Type | Requis |
|-------|------|--------|
| Nom | Text | oui |
| Prénom | Text | oui |
| Genre | Radio (M / F) | oui |
| Email | Email | non |
| Téléphone | Text | non |

---

## Actions

| Bouton | Comportement |
|--------|-------------|
| Créer le professeur | `POST /professeurs` |
| Enregistrer | `PATCH /professeurs/:id` (édition) |
| Annuler | Retour sans sauvegarde |
