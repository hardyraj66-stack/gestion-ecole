<a id="BC-NIV"></a>
# BC-NIV — Bounded Context : Niveaux

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-NIV |
| Nom | Niveaux |
| Module NestJS | `NiveauxModule` |
| Collection MongoDB | `niveaux` |
| Canal Socket.IO | `niveaux` |

---

## Rôle

Gérer les niveaux scolaires de l'établissement (ex: 6ème, 5ème, Terminale…). Les niveaux servent de structure pédagogique : chaque classe est rattachée à un niveau, et chaque niveau référence les matières enseignées avec leurs coefficients spécifiques.

---

## Responsabilités

1. Créer et ordonner les niveaux scolaires
2. Associer des matières à un niveau (`matiere_ids`)
3. Réordonner les niveaux après modification (`POST /niveaux/recompact`)
4. Supprimer un niveau non utilisé

---

## Agrégat principal — Niveau

| Champ | Type | Contrainte |
|-------|------|-----------|
| `nom` | string | requis, unique |
| `ordre` | number | requis, défaut 0 — ordre d'affichage |
| `description` | string | optionnel |
| `matiere_ids` | `string[]` | IDs des matières enseignées dans ce niveau |

**Index MongoDB :**
- `{ ordre: 1, nom: 1 }`

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-NIV-001 | Créer un niveau | `POST /niveaux` |
| UC-NIV-002 | Modifier un niveau (nom, ordre, matières) | `PATCH /niveaux/:id` |
| UC-NIV-003 | Réordonner les niveaux | `POST /niveaux/recompact` |
| UC-NIV-004 | Supprimer un niveau | `DELETE /niveaux/:id` |

---

## Contrat API

### GET /niveaux
**Réponse** : tableau de niveaux triés par `ordre`

### GET /niveaux/:id
**Réponse** : objet Niveau

### POST /niveaux
**Corps** : `{ nom, ordre?, description?, matiere_ids? }`
**Réponse** : objet Niveau créé
**Événement** : `niveau:created`

### PATCH /niveaux/:id
**Corps** : champs partiels de Niveau
**Réponse** : objet Niveau mis à jour
**Événement** : `niveau:updated`

### DELETE /niveaux/:id
**Réponse** : `{ id }`
**Événement** : `niveau:deleted`

### POST /niveaux/recompact
**Description** : Réassigne les valeurs `ordre` de 1 à N pour tous les niveaux, en conservant leur ordre relatif
**Réponse** : tableau des niveaux mis à jour
**Événement** : `niveau:updated`

---

## Règles métier

| Règle | Description |
|-------|-------------|
| R-NIV-001 | Le nom d'un niveau est unique |
| R-NIV-002 | La suppression d'un niveau avec des classes actives est bloquée |
| R-NIV-003 | Les niveaux sont utilisés comme source de vérité pour les formulaires de création de classe |

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `niveau:created` | objet Niveau | POST /niveaux |
| `niveau:updated` | objet Niveau ou `{}` | PATCH /niveaux/:id, POST /niveaux/recompact |
| `niveau:deleted` | `{ id }` | DELETE /niveaux/:id |
