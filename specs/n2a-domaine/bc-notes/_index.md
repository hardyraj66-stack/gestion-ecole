<a id="BC-NOT"></a>
# BC-NOT — Bounded Context : Notes

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-NOT |
| Nom | Notes |
| Module NestJS | `NotesModule` |
| Collection MongoDB | `notes` |
| Canal Socket.IO | `notes` |

---

## Rôle

Gérer la saisie et l'annulation des notes individuelles par élève et par matière. Chaque note est rattachée à un trimestre et une année scolaire. Les notes servent de base au calcul des bulletins.

---

## Responsabilités

1. Saisir une note pour un élève dans une matière et un trimestre donné
2. Modifier une note existante
3. Annuler une note (soft-delete via champ `annulee`)
4. Servir les données pour le calcul des moyennes et bulletins

---

## Agrégat principal — Note

| Champ | Type | Contrainte |
|-------|------|-----------|
| `eleve_id` | string | requis |
| `matiere_id` | string | requis |
| `valeur` | number | requis (0-20) |
| `trimestre` | `1` \| `2` \| `3` | requis |
| `type` | `'ds'` \| `'evaluation'` \| `null` | optionnel |
| `date` | string | requis |
| `commentaire` | string | optionnel |
| `annulee` | boolean | défaut `false` |
| `annee_scolaire` | string | label de l'année active |

**Index MongoDB :**
- `{ eleve_id: 1, trimestre: 1, annulee: 1 }`
- `{ matiere_id: 1 }`
- `{ annee_scolaire: 1 }`

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-NOT-001 | Saisir une note | `POST /notes` |
| UC-NOT-002 | Modifier une note | `PATCH /notes/:id` |
| UC-NOT-003 | Annuler une note | `PATCH /notes/:id/annuler` |

---

## Contrat API

### POST /notes
**Corps** : `{ eleve_id, matiere_id, valeur, trimestre, type?, date, commentaire?, annee_scolaire }`
**Réponse** : objet Note créé
**Événement** : `note:created`

### PATCH /notes/:id
**Corps** : champs partiels de Note
**Réponse** : objet Note mis à jour
**Événement** : `note:updated`

### PATCH /notes/:id/annuler
**Corps** : aucun
**Réponse** : `{ id }`
**Événement** : `note:updated`

---

## Règles métier

| Règle | Description |
|-------|-------------|
| R-NOT-001 | Une note annulée (`annulee: true`) n'est pas prise en compte dans les moyennes |
| R-NOT-002 | La valeur d'une note est comprise entre 0 et 20 |
| R-NOT-003 | L'année scolaire est héritée du contexte actif au moment de la saisie |

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `note:created` | objet Note | POST /notes |
| `note:updated` | objet Note ou `{ id }` | PATCH /notes/:id ou /annuler |
