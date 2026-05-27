<a id="BC-PLN"></a>
# BC-PLN — Bounded Context : Planning

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-PLN |
| Nom | Planning |
| Module NestJS | `PlanningModule` |
| Collection MongoDB | `creneaux` |
| Canal Socket.IO | `planning` |

---

## Rôle

Gérer les créneaux horaires hebdomadaires par classe. Un créneau représente un cours récurrent (jour + heure de début + heure de fin + matière + salle). Prend en charge la fusion automatique des créneaux adjacents de même matière.

---

## Responsabilités

1. Créer un créneau de cours pour une classe
2. Modifier un créneau (déplacer, changer de salle, changer de matière)
3. Supprimer un créneau
4. Fusionner les créneaux adjacents de même matière dans une classe (`mergeAdjacent`)

---

## Agrégat principal — Créneau

| Champ | Type | Contrainte |
|-------|------|-----------|
| `classe_id` | string | requis |
| `matiere_id` | string | requis |
| `matiere_nom` | string | requis (dénormalisé) |
| `matiere_couleur` | string | défaut `'#2563eb'` |
| `jour` | `'Lundi'` \| `'Mardi'` \| `'Mercredi'` \| `'Jeudi'` \| `'Vendredi'` \| `'Samedi'` | requis |
| `heure_debut` | string | requis (ex: `"08:00"`) |
| `heure_fin` | string | requis (ex: `"09:00"`) |
| `salle` | string | requis |

**Index MongoDB :**
- `{ classe_id: 1 }`
- `{ salle: 1, jour: 1 }`
- `{ matiere_id: 1 }`

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-PLN-001 | Créer un créneau | `POST /planning` |
| UC-PLN-002 | Modifier un créneau | `PATCH /planning/:id` |
| UC-PLN-003 | Supprimer un créneau | `DELETE /planning/:id` |
| UC-PLN-004 | Fusionner les créneaux adjacents | `POST /planning/merge/:classeId` |

---

## Contrat API

### POST /planning
**Corps** : `{ classe_id, matiere_id, matiere_nom, matiere_couleur, jour, heure_debut, heure_fin, salle }`
**Réponse** : objet Créneau créé
**Événement** : `creneau:created`

### PATCH /planning/:id
**Corps** : champs partiels de Créneau
**Réponse** : objet Créneau mis à jour
**Événement** : `creneau:updated`

### DELETE /planning/:id
**Réponse** : `{ id }`
**Événement** : `creneau:deleted`

### POST /planning/merge/:classeId
**Réponse** : `{ merged: number }` — nombre de fusions effectuées
**Événement** : `creneau:updated` (si fusions > 0)

---

## Règles métier

| Règle | Description |
|-------|-------------|
| R-PLN-001 | Deux créneaux de même matière, dans la même classe, le même jour, avec des horaires adjacents peuvent être fusionnés |
| R-PLN-002 | La disponibilité d'une salle peut être vérifiée via `GET /salles/disponibles` avant création |
| R-PLN-003 | Un créneau peut utiliser une salle variable (choisie à la volée) ou une salle fixe de la classe |

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `creneau:created` | objet Créneau | POST /planning |
| `creneau:updated` | objet Créneau ou `{ classe_id }` | PATCH /planning/:id, POST /planning/merge |
| `creneau:deleted` | `{ id }` | DELETE /planning/:id |
