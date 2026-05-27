# ViewBuilderService

**Fichier source :** `server/src/read/view-builder.service.ts`

Service de maintenance des collections de vues dénormalisées (`read-*`). Appelé après chaque mutation pour garder les vues synchronisées avec les données sources.

---

## Rôle

Les collections `read-*` (read-classes, read-eleves, etc.) sont des vues pré-calculées optimisées pour la lecture. `ViewBuilderService` les met à jour en réponse aux écritures sur les collections sources.

---

## Collections gérées

| Collection source | Collection vue | Schéma |
|-------------------|----------------|--------|
| `classes` | `readclasses` | `read-classe.schema.ts` |
| `eleves` | `readeleves` | `read-eleve.schema.ts` |
| `matieres` | `readmatieres` | `read-matiere.schema.ts` |
| `notes` | `readnotes` | `read-note.schema.ts` |
| `creneaux` | `readcreneaux` | `read-creneau.schema.ts` |
| `salles` | `readsalles` | `read-salle.schema.ts` |
| `evaluations` | `readevaluations` | `read-evaluation.schema.ts` |

---

## Schémas des vues

### ReadClasse
```typescript
{
  source_id: string       // _id de la classe source (unique)
  nom, niveau, annee_scolaire, capacite, salle, salle_type
  nb_eleves: number       // calculé
  taux: number            // nb_eleves / capacite × 100
}
```

### ReadEleve
```typescript
{
  source_id: string
  annee_scolaire, nom, prenom, date_naissance, genre
  classe_id, email, telephone, adresse
  classe_nom: string      // dénormalisé
  classe_niveau: string   // dénormalisé
  pere, mere, tuteur
  statut
}
```

### ReadMatiere
```typescript
{
  source_id: string
  nom, code, coefficient, coefficients, description, couleur, actif
}
```

### ReadNote
```typescript
{
  source_id: string
  eleve_id, matiere_id, valeur, trimestre, type, date
  commentaire, annulee, annee_scolaire
}
```

### ReadCreneau
```typescript
{
  source_id: string
  classe_id, matiere_id, matiere_nom, matiere_couleur
  jour, heure_debut, heure_fin, salle, professeur_id
}
```

### ReadSalle
```typescript
{
  source_id: string
  nom, capacite, description, type, equipements
  accessible_pmr, batiment, etage, actif
}
```

### ReadEvaluation
```typescript
{
  source_id: string
  type, classe_id, matiere_id, trimestre, annee_scolaire
  date, statut, notes (array), nb_notes, nb_absents
}
```

---

## Méthodes principales

```typescript
async rebuildClasse(classeId: string): Promise<void>
// Recalcule nb_eleves et taux, upsert dans readclasses

async rebuildEleve(eleveId: string): Promise<void>
// Jointure avec classe pour classe_nom, classe_niveau, upsert dans readeleves

async rebuildMatiere(matiereId: string): Promise<void>
async rebuildNote(noteId: string): Promise<void>
async rebuildCreneau(creneauId: string): Promise<void>
async rebuildSalle(salleId: string): Promise<void>
async rebuildEvaluation(evalId: string): Promise<void>

async deleteFromView(collection: string, sourceId: string): Promise<void>
// Supprime l'entrée correspondante dans la vue
```

---

## Pattern upsert

```typescript
await this.readClasseModel.findOneAndUpdate(
  { source_id: classeId },
  { $set: { ...viewData } },
  { upsert: true, new: true }
)
```

---

## Appelé par

Chaque service de domaine appelle `ViewBuilderService` après une mutation :

```typescript
// Dans ClassesService.create(dto):
const classe = await this.classeModel.create(dto)
await this.viewBuilder.rebuildClasse(classe._id.toString())
this.eventsGateway.server.emit('classe:created', classe)
```

---

## Note sur la cohérence

Les vues sont éventuellement cohérentes : un bref délai existe entre la mutation et la mise à jour de la vue. Le front gère cela via le délai de 500ms dans `usePageFetch` avant le re-fetch socket.
