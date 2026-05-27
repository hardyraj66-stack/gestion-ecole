<a id="PAGE-EVA-002"></a>
# Détail d'une évaluation

> **Couche** : N2b — QUOI écrans (page : Détail évaluation)
> **Acteur concerné** : Secrétariat
> **UC sous-jacents** : [UC-EVA-002](../../n2a-domaine/bc-evaluations/_index.md), [UC-EVA-003](../../n2a-domaine/bc-evaluations/_index.md)
> **Type de page** : Grille de saisie
> **Route** : `/evaluations/:id`
> **Ce fichier contient** : grille de notes, publication, états
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## En-tête

- Classe, Matière, Type (DS / Évaluation), Trimestre, Date
- Badge statut : `Brouillon` (orange) / `Publié` (vert)

---

## Grille de saisie des notes

Un tableau avec une ligne par élève de la classe :

| Colonne | Type | Notes |
|---------|------|-------|
| Élève | Texte (lecture seule) | `nom prenom` |
| Note | Number input | 0–20, ou vide si absent |
| Absent | Checkbox | Si coché, la note est ignorée |

---

## Actions

| Bouton | État | Comportement |
|--------|------|-------------|
| Enregistrer | Toujours actif | `PATCH /evaluations/:id/notes` — sauvegarde en brouillon |
| Publier | Visible si brouillon | Confirmation → `PATCH /evaluations/:id/publier` — action irréversible |

---

## Comportement à la publication

- Statut passe à `publie`
- Les notes sont reportées dans la collection `notes` (UC-NOT-001 déclenchée automatiquement)
- La grille passe en lecture seule
- Bouton « Publier » masqué
