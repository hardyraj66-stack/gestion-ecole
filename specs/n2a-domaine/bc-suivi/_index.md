<a id="BC-SUI"></a>
# BC-SUI — Bounded Context : Suivi Disciplinaire

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-SUI |
| Nom | Suivi Disciplinaire |
| Module NestJS | `SuiviModule` |
| Collections MongoDB | `absences`, `avertissements`, `convocations` |

---

## Rôle

Gérer le suivi comportemental et disciplinaire des élèves : absences, retards, avertissements, et convocations des parents. Un mécanisme de convocation automatique peut être déclenché après un seuil d'avertissements.

---

## Responsabilités

1. Enregistrer les absences et retards d'un élève
2. Créer des avertissements disciplinaires
3. Générer des convocations parents (manuelles ou automatiques)
4. Marquer une convocation comme effectuée

---

## Agrégats

### Absence / Retard

| Champ | Type | Contrainte |
|-------|------|-----------|
| `eleve_id` | string | requis |
| `date` | string | requis |
| `motif` | string | optionnel |
| `type` | `'absence'` \| `'retard'` | requis |
| `duree` | string | pour les retards (ex: `"15 min"`) |
| `justifiee` | boolean | défaut `false` |
| `annee_scolaire` | string | optionnel |

### Avertissement

| Champ | Type | Contrainte |
|-------|------|-----------|
| `eleve_id` | string | requis |
| `motif` | string | requis |
| `annee_scolaire` | string | requis |
| `date` | string | requis |
| `commentaire` | string | optionnel |
| `type` | `'comportement'` \| `'degats'` \| `'absence'` \| `'autre'` | défaut `'comportement'` |

### Convocation

| Champ | Type | Contrainte |
|-------|------|-----------|
| `eleve_id` | string | requis |
| `date` | string | requis |
| `raison` | string | requis |
| `commentaire` | string | optionnel |
| `effectuee` | boolean | défaut `false` |
| `nb_avertissements` | number | snapshot du nb d'avertissements au moment de la convocation |
| `annee_scolaire` | string | optionnel |

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-SUI-001 | Enregistrer une absence | `POST /suivi/:eleveId/absences` |
| UC-SUI-002 | Enregistrer un retard | `POST /suivi/:eleveId/retards` |
| UC-SUI-003 | Supprimer une absence/retard | `DELETE /suivi/absences/:id` |
| UC-SUI-004 | Créer un avertissement | `POST /suivi/:eleveId/avertissements` |
| UC-SUI-005 | Supprimer un avertissement | `DELETE /suivi/avertissements/:id` |
| UC-SUI-006 | Créer une convocation | `POST /suivi/:eleveId/convocations` |
| UC-SUI-007 | Marquer une convocation effectuée | `PATCH /suivi/convocations/:id` |
| UC-SUI-008 | Supprimer une convocation | `DELETE /suivi/convocations/:id` |

---

## Contrat API

### GET /suivi/:eleveId/absences
**Query** : `anneeLabel?`
**Réponse** : liste des absences de l'élève

### POST /suivi/:eleveId/absences
**Corps** : `{ date, motif?, justifiee? }`
**Réponse** : objet Absence créé

### GET /suivi/:eleveId/retards
**Query** : `anneeLabel?`
**Réponse** : liste des retards de l'élève

### POST /suivi/:eleveId/retards
**Corps** : `{ date, motif?, duree? }`
**Réponse** : objet Absence créé (avec `type: 'retard'`)

### DELETE /suivi/absences/:id
**Réponse** : `{ id }`

### GET /suivi/:eleveId/avertissements
**Query** : `anneeLabel?`
**Réponse** : liste des avertissements de l'élève

### POST /suivi/:eleveId/avertissements
**Corps** : `{ motif, annee_scolaire, date, commentaire?, type? }`
**Réponse** : objet Avertissement créé

### DELETE /suivi/avertissements/:id
**Réponse** : `{ id }`

### GET /suivi/:eleveId/convocations
**Query** : `anneeLabel?`
**Réponse** : liste des convocations de l'élève

### POST /suivi/:eleveId/convocations
**Corps** : `{ date, raison, commentaire?, nb_avertissements? }`
**Réponse** : objet Convocation créé

### PATCH /suivi/convocations/:id
**Corps** : `{ effectuee?, commentaire? }`
**Réponse** : objet Convocation mis à jour

### DELETE /suivi/convocations/:id
**Réponse** : `{ id }`

---

## Règles métier

| Règle | Description |
|-------|-------------|
| R-SUI-001 | Après 3 avertissements, une convocation automatique peut être proposée au secrétariat |
| R-SUI-002 | Une absence peut être justifiée ou non — cela influe sur l'affichage dans la fiche élève |
| R-SUI-003 | Les données de suivi sont filtrables par année scolaire via `?anneeLabel=` |
