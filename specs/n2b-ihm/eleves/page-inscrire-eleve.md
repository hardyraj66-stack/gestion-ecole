<a id="PAGE-ELV-003"></a>
# Inscrire un élève

> **Couche** : N2b — QUOI écrans (page : Inscrire un élève)
> **Acteur concerné** : Secrétariat
> **UC sous-jacents** : [UC-ELV-001](../../n2a-domaine/bc-eleves/_index.md)
> **Type de page** : Formulaire CRUD
> **Route** : `/eleves/inscrire`
> **Ce fichier contient** : champs, sections, validations
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Sections du formulaire

### Section 1 — Identité

| Champ | Type | Requis |
|-------|------|--------|
| Nom | Text | oui |
| Prénom | Text | oui |
| Date de naissance | Date | oui |
| Genre | Radio (M / F) | oui |
| Adresse | Text | non |
| Email | Email | non |
| Téléphone | Text | non |

### Section 2 — Inscription

| Champ | Type | Requis |
|-------|------|--------|
| Classe | Select | oui — liste les classes actives |

### Section 3 — Famille (optionnel)

Sous-formulaires pour père, mère, tuteur :

| Champ | Type |
|-------|------|
| Nom | Text |
| Prénom | Text |
| Téléphone | Text |
| Email | Email |
| Statut (père/mère) | Select : vivant / décédé |
| Lien (tuteur) | Text |

---

## Validations

| Champ | Règle |
|-------|-------|
| Nom | Requis |
| Prénom | Requis |
| Date de naissance | Requis, format date valide |
| Genre | Requis |
| Classe | Requis, doit exister dans la liste |

---

## Actions

| Bouton | Comportement |
|--------|-------------|
| Inscrire | `POST /eleves` |
| Annuler | Retour sans sauvegarde |
