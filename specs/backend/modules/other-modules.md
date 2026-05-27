# Modules NestJS — Autres domaines

---

## Module Matières

**Dossier :** `server/src/matieres/`
**Préfixe controller :** `/matieres`

### Endpoints

```
POST   /matieres
  Body: { nom, code, description?, couleur?, coefficients: CoefficientNiveau[] }

PATCH  /matieres/:id
  Body: Partial<Matiere>

DELETE /matieres/:id
```

### Service

- `create` : valide que le code est unique, crée, rebuild vue, émet `matiere:created`
- `update` : met à jour, rebuild, émet `matiere:updated`
- `delete` : supprime si aucune note n'y est rattachée

---

## Module Notes

**Dossier :** `server/src/notes/`
**Préfixe controller :** `/notes`

### Endpoints

```
POST   /notes
  Body: { eleve_id, matiere_id, valeur, trimestre, type?, date, commentaire?, annee_scolaire }
  Logique: si une note du même type/trimestre/élève/matière existe, update plutôt que créer

PATCH  /notes/:id
  Body: { valeur?, commentaire? }

PATCH  /notes/:id/annuler
  → note.annulee = true

GET    /notes/bulletin/:eleveId
Query: trimestre, anneeLabel?
  → Service.getBulletin() — utilisé par NoteContext.getBulletinFromApi

GET    /notes/moyenne/:eleveId
Query: trimestre
  → Service.getMoyenneGenerale()
```

### Service

- `create` : vérifie doublons (même eleve+matiere+trimestre+type), upsert si doublon
- `annuler` : `findByIdAndUpdate(id, { annulee: true })`
- Émet `note:created` ou `note:updated`

---

## Module Planning

**Dossier :** `server/src/planning/`
**Préfixe controller :** `/planning`

### Endpoints

```
POST   /planning
  Body: { classe_id, matiere_id, jour, heure_debut, heure_fin, salle, professeur_id? }
  Validation: vérifie conflits de salle et de classe sur le créneau horaire
  Erreur 409 si conflit

PATCH  /planning/:id
  Body: Partial<Creneau>
  Validation: re-vérifie les conflits (sauf avec soi-même)

DELETE /planning/:id

GET    /planning/disponibilite
Query: jour, heure_debut, heure_fin, classeId?
  → Retourne les créneaux qui chevauchent le créneau demandé
```

### Service — logique de conflit

```typescript
async checkConflict(dto, excludeId?): Promise<string | null>
// Cherche un créneau existant avec:
//   - même salle, même jour, chevauchement horaire
//   OU
//   - même classe, même jour, chevauchement horaire
// Si trouvé: retourne message d'erreur lisible
// Sinon: retourne null (pas de conflit)
```

Chevauchement horaire : `A.debut < B.fin && A.fin > B.debut`

---

## Module Salles

**Dossier :** `server/src/salles/`
**Préfixe controller :** `/salles`

### Endpoints

```
POST   /salles
  Body: { nom, capacite, type, description?, batiment?, etage?, accessible_pmr?, equipements? }

PATCH  /salles/:id
DELETE /salles/:id

GET    /salles/disponibles
Query: jour, heure_debut, heure_fin
  → SallesService.getDisponibles()
  → Retourne toutes les salles avec flag `disponible` et `occupant` si prise
```

### getDisponibles(jour, heure_debut, heure_fin)

1. Charge toutes les salles actives
2. Charge tous les créneaux du jour avec chevauchement horaire
3. Pour chaque salle : vérifie si un créneau l'occupe → `disponible = false` + `occupant = {...}`
4. Retourne `SalleDisponible[]`

---

## Module Années Scolaires

**Dossier :** `server/src/annees/`
**Préfixe controller :** `/annees`

### Endpoints

```
GET    /annees
  → Liste toutes les années (triées par label desc)

POST   /annees
  Body: { label, debut, fin }
  Valide: label unique, statut = 'preparation'

PATCH  /annees/:id
  Body: { label?, debut?, fin? }

DELETE /annees/:id
  Interdit si statut != 'preparation'

PATCH  /annees/:id/demarrer
  → statut = 'active'
  → L'ancienne active passe en 'terminee'
  → Ajoute entrée dans historique: { action: 'demarree', date, details }

PATCH  /annees/:id/terminer
  → statut = 'terminee'
  → Ajoute entrée dans historique: { action: 'terminee', date, details }
```

### Règles métier

- Une seule année `active` à la fois
- `demarrer` : vérifie qu'il n'y a pas déjà une active
- `label` format recommandé : "YYYY-YYYY" (non enforced en base)

---

## Module Niveaux

**Dossier :** `server/src/niveaux/`
**Préfixe controller :** `/niveaux`

### Endpoints

```
GET    /niveaux
  → Liste triée par ordre

POST   /niveaux
  Body: { nom, ordre, description?, matiere_ids? }

PATCH  /niveaux/:id
  Body: Partial<Niveau>

DELETE /niveaux/:id
  Vérifie qu'aucune classe active n'est associée à ce niveau
```

---

## Module Professeurs

**Dossier :** `server/src/professeurs/`
**Préfixe controller :** `/professeurs`

### Endpoints

```
POST   /professeurs
  Body: { nom, prenom, email, telephone, genre }
  statut: 'actif' par défaut

PATCH  /professeurs/:id
PATCH  /professeurs/:id/desactiver   → statut = 'inactif'
PATCH  /professeurs/:id/activer      → statut = 'actif'

DELETE /professeurs/:id
  Vérifie qu'aucune affectation n'existe
```

Émet `professeur:event` après toute mutation.

---

## Module TeacherAssignments

**Dossier :** `server/src/teacher-assignments/`
**Préfixe controller :** `/teacher-assignments`

### Endpoints

```
GET    /teacher-assignments
  → Toutes les affectations

POST   /teacher-assignments
  Body: { professeur_id, classe_id, matiere_id }
  Contrainte unique: (classe_id, matiere_id) — upsert si existe

PATCH  /teacher-assignments/:id
  Body: { professeur_id }

DELETE /teacher-assignments/:id
```

Émet `assignment:event` après toute mutation.

---

## Module Périodes

**Dossier :** `server/src/periodes/`
**Préfixe controller :** `/periodes`

### Endpoints

```
GET    /periodes
Query: annee_scolaire
  → 6 périodes de l'année (crée les manquantes si nécessaire)

GET    /periodes/active
  → Période dont les dates encadrent aujourd'hui

PATCH  /periodes/:id
  Body: { date_debut?, date_fin?, trimestre?, type? }

PATCH  /periodes/:id/terminer
  → terminee = true
```

Émet `periode:updated` après chaque modification.

---

## Module Évaluations

**Dossier :** `server/src/evaluations/`
**Préfixe controller :** `/evaluations`

### Endpoints

```
POST   /evaluations
  Body: { type, classe_id, matiere_id, trimestre, annee_scolaire, date }
  statut: 'brouillon' par défaut
  Contrainte: une seule évaluation par (classe, matière, trimestre, type)

PATCH  /evaluations/:id/notes
  Body: { notes: Array<{ eleve_id, valeur, absent }> }
  → Remplace entièrement le tableau notes[]

PATCH  /evaluations/:id/publier
  → statut = 'publie'
  → Génère les Note dans la collection notes (une par élève non absent)
  → Les notes existantes du même type/trimestre sont annulées puis recréées

DELETE /evaluations/:id
  Interdit si statut = 'publie'
```

### publier — logique détaillée

```typescript
async publier(id: string): Promise<Evaluation> {
  const evaluation = await this.evaluationModel.findById(id)
  // 1. Annuler les notes existantes du même type+trimestre pour ces élèves
  await this.noteModel.updateMany(
    { eleve_id: { $in: eleveIds }, matiere_id, trimestre, type: evaluation.type, annulee: false },
    { $set: { annulee: true } }
  )
  // 2. Créer les nouvelles notes pour les élèves non absents
  const notesToCreate = evaluation.notes
    .filter(n => !n.absent && n.valeur !== null)
    .map(n => ({ eleve_id: n.eleve_id, matiere_id, valeur: n.valeur, trimestre, type, ... }))
  await this.noteModel.insertMany(notesToCreate)
  // 3. Passer l'évaluation en publie
  evaluation.statut = 'publie'
  await evaluation.save()
  // 4. Émettre l'événement
  this.eventsGateway.server.emit('evaluation:publie', evaluation)
}
```

---

## Module Suivi (Absences, Avertissements, Convocations)

**Dossier :** `server/src/suivi/`
**Préfixe controller :** `/suivi`

### Endpoints

```
POST   /suivi/absences
  Body: { eleve_id, date, type, motif?, duree?, justifiee?, annee_scolaire }

PATCH  /suivi/absences/:id
DELETE /suivi/absences/:id

POST   /suivi/avertissements
  Body: { eleve_id, motif, type, commentaire?, annee_scolaire }
  Logique auto: si nb avertissements atteint 3, crée automatiquement une Convocation

PATCH  /suivi/avertissements/:id
DELETE /suivi/avertissements/:id

POST   /suivi/convocations
  Body: { eleve_id, date, raison, commentaire?, annee_scolaire }

PATCH  /suivi/convocations/:id/effectuee
  → effectuee = true

DELETE /suivi/convocations/:id
```

---

## Module Exclusions

**Dossier :** `server/src/exclusions/`
**Préfixe controller :** `/exclusions`

```
GET  /exclusions
Query: annee_scolaire?
  → Liste des exclusions de l'année

GET  /exclusions/:id
```

Créations uniquement via `ElevesService.setStatut` — pas de POST direct.

---

## Module Départs

**Dossier :** `server/src/departs/`
**Préfixe controller :** `/departs`

Identique à Exclusions : lecture seule en API directe, écritures via `ElevesService.setStatut`.

---

## Module Export

**Dossier :** `server/src/export/`
**Préfixe controller :** `/export`

### Endpoints

```
GET  /export/eleves?format=csv|xlsx|pdf&classeId=?&anneeLabel=?
GET  /export/bulletin/:eleveId?format=pdf&trimestre=N
GET  /export/planning/:classeId?format=pdf
GET  /export/notes?format=xlsx&classeId=?&matiereId=?&trimestre=N
```

### Service

- Génère CSV/XLSX/PDF sans dépendances npm externes
- CSV : construction manuelle de la chaîne (séparateur `;`, encodage UTF-8 BOM)
- XLSX : format ZIP manuel (OpenXML) ou bibliothèque légère intégrée
- PDF : génération HTML → string retourné, ou template statique

---

## Module Migration

**Dossier :** `server/src/migration/`

Scripts de migration de données one-shot. Exécutés manuellement ou au démarrage si un flag est présent.

```typescript
// MigrationService.run()
// Exemples de migrations:
// - Ajout du champ annee_scolaire sur les notes existantes
// - Migration coefficients[] depuis coefficient legacy
// - Normalisation des professeur_nom dans les créneaux
```

---

## Middleware

**Fichier :** `server/src/common/api-logger.middleware.ts`

Log chaque requête HTTP : méthode, URL, status, durée.

```typescript
@Injectable()
export class ApiLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()
    res.on('finish', () => {
      console.log(`${req.method} ${req.url} ${res.statusCode} +${Date.now() - start}ms`)
    })
    next()
  }
}
```

Appliqué globalement dans `AppModule.configure()`.
