<a id="PAGE-CLS-003"></a>
# Créer / Modifier une classe

> **Couche** : N2b — QUOI écrans (page : Créer une classe)
> **Acteur concerné** : Secrétariat
> **UC sous-jacents** : [UC-CLS-001](../../n2a-domaine/bc-classes/_index.md), [UC-CLS-002](../../n2a-domaine/bc-classes/_index.md)
> **Type de page** : Formulaire CRUD
> **Route** : `/classes/creer` (création), édition via modal sur la liste
> **Hook de données** : `useCreateClasseData` → `GET /read/create-classe-data`
> **Ce fichier contient** : champs du formulaire, validations, comportement conditionnel
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Champs du formulaire

| Champ | Type | Requis | Règle |
|-------|------|--------|-------|
| Nom de la classe | Text | oui | ex: `"6ème A"` |
| Niveau | Select | oui | Liste des niveaux depuis `GET /read/niveaux` |
| Capacité | Number | oui | Défaut : 30 |
| Type de salle | Radio | oui | `fixe` ou `variable` |
| Salle fixe | Select | conditionnel | Affiché seulement si `salle_type = 'fixe'` — liste des salles actives |

---

## Comportement conditionnel

Quand `salle_type = 'variable'` :
- Le champ « Salle fixe » est masqué
- Le champ `salle` est envoyé vide dans le payload

---

## Validations

| Champ | Règle |
|-------|-------|
| Nom | Requis, non vide |
| Niveau | Requis, doit exister dans la liste |
| Capacité | Nombre > 0 |

---

## Actions

| Bouton | Comportement |
|--------|-------------|
| Valider | `POST /classes` (création) ou `PATCH /classes/:id` (édition) |
| Annuler | Retour sans sauvegarde |

---

## Pré-requis

- Une année scolaire active doit exister — sinon message d'erreur « Aucune année scolaire active »
- Des niveaux doivent être configurés — sinon le select niveau est vide
