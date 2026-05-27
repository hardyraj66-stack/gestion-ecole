<a id="BC-EVA"></a>
# BC-EVA — Bounded Context : Évaluations

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-EVA |
| Nom | Évaluations |
| Module NestJS | `EvaluationsModule` |
| Collection MongoDB | `evaluations` |
| Canal Socket.IO | `evaluations` |

---

## Rôle

Gérer les évaluations (DS ou évaluation de cours) par classe, matière et trimestre. Une évaluation contient les notes de chaque élève de la classe et possède un statut (`brouillon` → `publie`).

---

## Responsabilités

1. Créer une évaluation (DS ou évaluation) pour une classe/matière/trimestre
2. Saisir les notes des élèves dans l'évaluation
3. Publier une évaluation (rend les notes visibles et les reporte dans le bulletin)
4. Supprimer une évaluation en brouillon

---

## Agrégat principal — Évaluation

| Champ | Type | Contrainte |
|-------|------|-----------|
| `type` | `'ds'` \| `'evaluation'` | requis |
| `classe_id` | string | requis |
| `matiere_id` | string | requis |
| `trimestre` | `1` \| `2` \| `3` | requis |
| `annee_scolaire` | string | requis |
| `date` | string | requis |
| `statut` | `'brouillon'` \| `'publie'` | défaut `'brouillon'` |
| `notes` | `[{ eleve_id, valeur: number\|null, absent: boolean }]` | tableau des notes par élève |

**Index MongoDB :**
- `{ classe_id, matiere_id, trimestre, type }` — unique

> Un seul DS et une seule Évaluation par triplet (classe, matière, trimestre).

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-EVA-001 | Créer une évaluation | `POST /evaluations` |
| UC-EVA-002 | Saisir les notes | `PATCH /evaluations/:id/notes` |
| UC-EVA-003 | Publier une évaluation | `PATCH /evaluations/:id/publier` |
| UC-EVA-004 | Supprimer une évaluation | `DELETE /evaluations/:id` |

---

## Contrat API

### POST /evaluations
**Corps** : `{ type, classe_id, matiere_id, trimestre, annee_scolaire, date }`
**Réponse** : objet Évaluation créé
**Événement** : `evaluation:created`

### PATCH /evaluations/:id/notes
**Corps** : `{ notes: [{ eleve_id, valeur?, absent? }] }`
**Réponse** : objet Évaluation mis à jour
**Événement** : `evaluation:updated`

### PATCH /evaluations/:id/publier
**Réponse** : objet Évaluation avec `statut: 'publie'`
**Événement** : `evaluation:publie`

### DELETE /evaluations/:id
**Réponse** : résultat de la suppression
**Événement** : `evaluation:deleted`

---

## Règles métier

| Règle | Description |
|-------|-------------|
| R-EVA-001 | Maximum 1 DS + 1 Évaluation par (classe, matière, trimestre) |
| R-EVA-002 | La publication reporte les notes dans la collection `notes` pour le bulletin |
| R-EVA-003 | Un élève absent peut avoir `absent: true` sans valeur numérique |

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `evaluation:created` | objet Évaluation | POST /evaluations |
| `evaluation:updated` | objet Évaluation | PATCH /evaluations/:id/notes |
| `evaluation:publie` | objet Évaluation | PATCH /evaluations/:id/publier |
| `evaluation:deleted` | résultat | DELETE /evaluations/:id |
