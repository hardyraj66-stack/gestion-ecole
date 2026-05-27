<a id="PAGE-SAL-003"></a>
# Créer / Modifier une salle

> **Couche** : N2b — QUOI écrans (page : Créer une salle)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-SAL-001](../../n2a-domaine/bc-salles/_index.md), [UC-SAL-003](../../n2a-domaine/bc-salles/_index.md)
> **Type de page** : Formulaire CRUD
> **Route** : `/salles/creer`
> **Ce fichier contient** : champs du formulaire, validations
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Champs du formulaire

| Champ | Type | Requis | Notes |
|-------|------|--------|-------|
| Nom | Text | oui | Identifiant lisible (ex: « Salle 101 ») |
| Capacité | Number | oui | Défaut : 30 |
| Type | Select | oui | `standard / laboratoire / informatique / sport / arts / amphi / autre` |
| Bâtiment | Text | non | |
| Étage | Text | non | |
| Description | Textarea | non | |
| Équipements | Checkboxes | non | `projecteur / ordinateurs / tableau_interactif / labo_scientifique / sono / climatisation` |
| Accessibilité PMR | Checkbox | non | |

---

## Actions

| Bouton | Comportement |
|--------|-------------|
| Créer la salle | `POST /salles` |
| Enregistrer | `PATCH /salles/:id` (édition) |
| Annuler | Retour sans sauvegarde |
