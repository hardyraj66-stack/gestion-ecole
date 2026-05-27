<a id="BC-CLS"></a>
# BC-CLS — Bounded Context : Classes

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-CLS |
| Nom | Classes |
| Module NestJS | `ClassesModule` |
| Collection MongoDB | `classes` |
| Canal Socket.IO | `classes` |

---

## Rôle

Gérer les classes scolaires de l'établissement : création, modification, désactivation. Une classe appartient à une année scolaire active, un niveau, et peut avoir une salle fixe ou utiliser des salles variables par créneau.

---

## Responsabilités

1. Créer une classe rattachée à l'année scolaire active
2. Modifier les informations d'une classe (nom, capacité, salle, type de salle)
3. Désactiver une classe (soft-delete via champ `actif`)
4. Alimenter les vues dénormalisées via `ViewBuilderService`

---

## Agrégat principal — Classe

| Champ | Type | Contrainte |
|-------|------|-----------|
| `nom` | string | requis |
| `niveau` | string | requis — nom du niveau scolaire |
| `annee_scolaire` | string | requis — label de l'année active (injecté serveur) |
| `capacite` | number | requis, défaut 30 |
| `salle` | string | optionnel — nom ou ID de la salle |
| `salle_type` | `'fixe'` \| `'variable'` | requis, défaut `'fixe'` |
| `actif` | boolean | défaut `true` |

**Index MongoDB :**
- `{ annee_scolaire: 1 }`
- `{ annee_scolaire: 1, actif: 1 }`
- `{ salle: 1, salle_type: 1, actif: 1 }`
- `{ niveau: 1, actif: 1 }`

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-CLS-001 | Créer une classe | `POST /classes` |
| UC-CLS-002 | Modifier une classe | `PATCH /classes/:id` |
| UC-CLS-003 | Désactiver une classe | `PATCH /classes/:id/desactiver` |

---

## Contrat API

### POST /classes
**Corps** : `{ nom, niveau, capacite, salle?, salle_type }`
**Règle** : une année scolaire active doit exister — sinon 400
**Réponse** : objet Classe créé
**Événement** : `classe:created`

### PATCH /classes/:id
**Corps** : champs partiels de Classe
**Réponse** : objet Classe mis à jour
**Événement** : `classe:updated`

### PATCH /classes/:id/desactiver
**Corps** : aucun
**Réponse** : `{ id }`
**Événement** : `classe:updated`

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `classe:created` | objet Classe | POST /classes |
| `classe:updated` | objet Classe ou `{ id }` | PATCH /classes/:id ou /desactiver |
