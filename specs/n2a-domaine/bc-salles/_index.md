<a id="BC-SAL"></a>
# BC-SAL — Bounded Context : Salles

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-SAL |
| Nom | Salles |
| Module NestJS | `SallesModule` |
| Collection MongoDB | `salles` |
| Canal Socket.IO | `salles` |

---

## Rôle

Gérer le référentiel des salles de l'établissement. Fournir des méthodes pour vérifier la disponibilité d'une salle sur un créneau horaire et calculer les statistiques d'utilisation.

---

## Responsabilités

1. Créer, modifier et supprimer une salle
2. Vérifier la disponibilité d'une salle sur un créneau donné
3. Calculer les statistiques d'occupation (taux, créneaux/semaine)
4. Bloquer la suppression si la salle est active dans des créneaux

---

## Agrégat principal — Salle

| Champ | Type | Contrainte |
|-------|------|-----------|
| `nom` | string | requis |
| `capacite` | number | requis, défaut 30 |
| `description` | string | optionnel |
| `type` | `'standard'` \| `'laboratoire'` \| `'informatique'` \| `'sport'` \| `'arts'` \| `'amphi'` \| `'autre'` | requis, défaut `'standard'` |
| `equipements` | `string[]` | valeurs: `'projecteur'`, `'ordinateurs'`, `'tableau_interactif'`, `'labo_scientifique'`, `'sono'`, `'climatisation'` |
| `accessible_pmr` | boolean | défaut `false` |
| `batiment` | string | optionnel |
| `etage` | string | optionnel |
| `actif` | boolean | défaut `true` |

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-SAL-001 | Créer une salle | `POST /salles` |
| UC-SAL-002 | Consulter l'occupation d'une salle | `GET /salles/:id/stats` |
| UC-SAL-003 | Modifier une salle | `PATCH /salles/:id` |
| UC-SAL-004 | Supprimer une salle | `DELETE /salles/:id` |
| UC-SAL-005 | Vérifier disponibilité | `GET /salles/disponibles` |

---

## Contrat API

### GET /salles/disponibles
**Query** : `jour`, `heure_debut`, `heure_fin`, `excludeCreneauId?`
**Réponse** : tableau de salles disponibles sur ce créneau

### GET /salles/:id/stats
**Réponse** : `{ creneaux_par_semaine, taux_occupation }` et la liste des créneaux utilisant la salle

### GET /salles/:id/usage
**Réponse** : `{ utilisee: boolean, creneaux_actifs: number }`

### POST /salles
**Corps** : `{ nom, capacite, type, equipements?, accessible_pmr?, batiment?, etage? }`
**Réponse** : objet Salle créé
**Événement** : `salle:created`

### PATCH /salles/:id
**Corps** : champs partiels de Salle
**Réponse** : objet Salle mis à jour
**Événement** : `salle:updated`

### DELETE /salles/:id
**Query** : `force=true` pour forcer la suppression malgré l'usage
**Comportement** : retourne 400 avec `{ code: 'SALLE_EN_USAGE', creneaux_actifs }` si la salle est en usage et `force` absent
**Événement** : `salle:deleted`

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `salle:created` | objet Salle | POST /salles |
| `salle:updated` | objet Salle | PATCH /salles/:id |
| `salle:deleted` | `{ id }` | DELETE /salles/:id |
