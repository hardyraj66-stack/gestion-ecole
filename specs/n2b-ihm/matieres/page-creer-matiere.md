<a id="PAGE-MAT-002"></a>
# Créer / Modifier une matière

> **Couche** : N2b — QUOI écrans (page : Créer une matière)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-MAT-001](../../n2a-domaine/bc-matieres/_index.md), [UC-MAT-002](../../n2a-domaine/bc-matieres/_index.md)
> **Type de page** : Formulaire CRUD avec prévisualisation
> **Route** : `/matieres/creer`
> **Ce fichier contient** : champs, prévisualisation temps réel, coefficients par niveau
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Champs du formulaire

| Champ | Type | Requis | Notes |
|-------|------|--------|-------|
| Nom | Text | oui | ex: « Mathématiques » |
| Code | Text | oui | Court, majuscules (ex: `MATH`) |
| Couleur | Color picker | non | Couleur d'affichage dans le planning |
| Description | Textarea | non | |
| Coefficient global | Number | non | Utilisé si aucun coefficient par niveau |
| Coefficients par niveau | Tableau dynamique | non | Une ligne par niveau : `{ niveau, coefficient }` |

---

## Prévisualisation temps réel

Un aperçu de la carte matière est affiché en temps réel pendant la saisie, reflétant la couleur, le code, et le nom.

---

## Tableau des coefficients par niveau

Pour chaque niveau existant (`GET /niveaux`), une ligne avec :
- Nom du niveau (lecture seule)
- Champ coefficient (number)

---

## Actions

| Bouton | Comportement |
|--------|-------------|
| Créer la matière | `POST /matieres` |
| Enregistrer | `PATCH /matieres/:id` (édition) |
| Annuler | Retour sans sauvegarde |
