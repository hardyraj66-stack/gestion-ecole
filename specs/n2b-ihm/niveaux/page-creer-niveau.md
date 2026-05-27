<a id="PAGE-NIV-002"></a>
# Créer / Modifier un niveau

> **Couche** : N2b — QUOI écrans (page : Créer un niveau)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-NIV-001](../../n2a-domaine/bc-niveaux/_index.md), [UC-NIV-002](../../n2a-domaine/bc-niveaux/_index.md)
> **Type de page** : Formulaire CRUD
> **Route** : `/niveaux/creer`
> **Ce fichier contient** : champs, association de matières
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Champs du formulaire

| Champ | Type | Requis | Notes |
|-------|------|--------|-------|
| Nom | Text | oui | ex: « 6ème » |
| Ordre | Number | oui | Position dans la liste (entier) |
| Description | Textarea | non | |
| Matières associées | Multi-select | non | Liste des matières actives — les IDs sélectionnés alimentent `matiere_ids` |

---

## Actions

| Bouton | Comportement |
|--------|-------------|
| Créer le niveau | `POST /niveaux` |
| Enregistrer | `PATCH /niveaux/:id` (édition) |
| Annuler | Retour sans sauvegarde |
