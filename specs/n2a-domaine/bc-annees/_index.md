<a id="BC-ANN"></a>
# BC-ANN — Bounded Context : Années Scolaires

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-ANN |
| Nom | Années Scolaires |
| Module NestJS | `AnneesModule` |
| Collection MongoDB | `anneescolaires` |
| Canal Socket.IO | `annees` |

---

## Rôle

Gérer le cycle de vie des années scolaires (préparation → active → terminée). Fournir le mécanisme de snapshot pour l'accès en lecture seule aux données archivées.

---

## Responsabilités

1. Préparer une nouvelle année scolaire
2. Démarrer une année (passe en `active`, l'ancienne passe en `terminee`)
3. Terminer/clôturer une année (passe en `terminee`)
4. Fournir le snapshot d'une année archivée pour le mode consultation
5. Tracer l'historique des actions sur l'année

---

## Agrégat principal — AnneeScolaire

| Champ | Type | Contrainte |
|-------|------|-----------|
| `label` | string | requis, unique (ex: `"2024-2025"`) |
| `debut` | string | requis — date de début |
| `fin` | string | requis — date de fin |
| `statut` | `'preparation'` \| `'active'` \| `'terminee'` | défaut `'preparation'` |
| `historique` | `[{ action, date, details }]` | log des actions sur l'année |

**Index MongoDB :**
- `{ statut: 1 }`

---

## Cycle de vie

```
preparation  →  active  →  terminee
```

- Une seule année peut être `active` à la fois
- Une seule année peut être `en preparation` à la fois
- Le démarrage d'une année en préparation passe l'éventuelle ancienne active en `terminee`

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-ANN-001 | Créer une année en préparation | `POST /annees` |
| UC-ANN-002 | Démarrer une année | `POST /annees/:id/demarrer` |
| UC-ANN-003 | Terminer une année | `POST /annees/:id/terminer` |
| UC-ANN-004 | Consulter le snapshot d'une année | `GET /annees/:id/snapshot` |
| UC-ANN-005 | Quitter le mode archive | (frontend — reset du ViewingContext) |

---

## Contrat API

### GET /annees
**Réponse** : tableau de toutes les années scolaires

### GET /annees/active
**Réponse** : objet AnneeScolaire active ou `null`

### GET /annees/:id
**Réponse** : objet AnneeScolaire

### GET /annees/:id/snapshot
**Réponse** : snapshot complet de l'année (classes, élèves, notes, planning, etc.)

### POST /annees
**Corps** : `{ label, debut, fin }`
**Réponse** : objet AnneeScolaire créé avec statut `'preparation'`
**Événement** : `annee:created`

### PATCH /annees/:id
**Corps** : champs partiels de AnneeScolaire
**Réponse** : objet AnneeScolaire mis à jour
**Événement** : `annee:updated`

### DELETE /annees/:id
**Réponse** : `{ id }`
**Événement** : `annee:deleted`

### POST /annees/:id/demarrer
**Description** : passe l'année en `active` et l'éventuelle ancienne active en `terminee`
**Réponse** : objet AnneeScolaire
**Événement** : `annee:updated`

### POST /annees/:id/terminer
**Description** : passe l'année active en `terminee` et crée automatiquement une nouvelle année en préparation
**Réponse** : `{ terminee, nouvelle }` (les deux objets AnneeScolaire)
**Événement** : `annee:updated` (terminée) + `annee:created` (nouvelle)

---

## Règles métier

| Règle | Description |
|-------|-------------|
| R-ANN-001 | Impossible de créer une 2e année en `preparation` si une existe déjà |
| R-ANN-002 | Le `label` de l'année est injecté automatiquement dans les classes et notes créées pendant son cycle |
| R-ANN-003 | Le mode archive est en lecture seule — tous les boutons d'action sont masqués ou désactivés |
| R-ANN-004 | Le snapshot contient toutes les données de l'année au moment de la consultation |

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `annee:created` | objet AnneeScolaire | POST /annees, POST /annees/:id/terminer |
| `annee:updated` | objet AnneeScolaire | PATCH, POST demarrer, POST terminer |
| `annee:deleted` | `{ id }` | DELETE /annees/:id |
