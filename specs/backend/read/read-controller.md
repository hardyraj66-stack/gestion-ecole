# ReadController

**Fichier source :** `server/src/read/read.controller.ts`
**Préfixe :** `/read`

Contrôleur dédié à toutes les lectures de l'application. Aucune mutation ici — uniquement des `GET`.

---

## Endpoints

Tous les endpoints acceptent optionnellement `?anneeLabel=XXXX-XXXX` pour le mode archive.

### Dashboard

```
GET /read/dashboard
Query: classesPage?, classesLimit?, anneeLabel?
→ ReadService.getDashboard(page, limit, anneeLabel)
```

### Classes

```
GET /read/classes
Query: page?, limit?, search?, niveau?, anneeLabel?
→ ReadService.getClassesList(page, limit, search, niveau, anneeLabel)

GET /read/classes/:id/eleves
Query: page?, limit?, search?, eleveId?, anneeLabel?
→ ReadService.getClasseEleves(id, page, limit, search, eleveId, anneeLabel)
Throws NotFoundException si la classe n'existe pas
```

### Élèves

```
GET /read/eleves
Query: page?, limit?, search?, classeId?, eleveId?, anneeLabel?
→ ReadService.getElevesList(page, limit, search, classeId, eleveId, anneeLabel)

GET /read/eleves/:id/fiche
Query: anneeLabel?
→ ReadService.getEleveFiche(id, anneeLabel)
Throws NotFoundException si l'élève n'existe pas
```

### Matières

```
GET /read/matieres
Query: page?, limit?, niveau?
→ ReadService.getMatieresList(page, limit, niveau)
```

### Salles

```
GET /read/salles
Query: page?, limit?, type?, search?
→ ReadService.getSallesList(page, limit, type, search)

GET /read/salles/:id
→ ReadService.getSalleDetail(id)
Throws NotFoundException si absente
```

### Planning

```
GET /read/planning/classes
Query: anneeLabel?
→ ReadService.getPlanningClasses(anneeLabel)

GET /read/planning/classe/:id
→ ReadService.getPlanningClasse(id)
Throws NotFoundException si absente
```

### Notes

```
GET /read/notes
→ ReadService.getNotesPage()

GET /read/notes/filters
Query: anneeLabel?
→ ReadService.getNotesFilters(anneeLabel)

GET /read/notes/eleves
Query: classeId, matiereId, trimestre, anneeLabel?
→ ReadService.getNotesEleves(classeId, matiereId, trimestre, anneeLabel)
```

### Bulletin

```
GET /read/bulletin/:eleveId
Query: trimestre, anneeLabel?
→ ReadService.getBulletin(eleveId, trimestre, anneeLabel)
Throws NotFoundException si l'élève n'existe pas
```

### Évaluations

```
GET /read/evaluations
Query: classeId?, matiereId?, trimestre?, statut?, page?, limit?, anneeLabel?
→ ReadService.getEvaluationsList(...)

GET /read/evaluations/:id
→ ReadService.getEvaluationDetail(id)
Throws NotFoundException si absente
```

### Périodes

```
GET /read/periodes
Query: annee_scolaire
→ ReadService.getPeriodes(annee_scolaire)

GET /read/periodes/active
→ ReadService.getActivePeriode()
ATTENTION: route /active doit être définie AVANT /:id pour éviter le conflit de route
```

### Années scolaires

```
GET /read/annees/:id/snapshot
→ ReadService.getAnneeSnapshot(id)
Throws NotFoundException si absente
```

### Niveaux

```
GET /read/niveaux
Query: anneeLabel?
→ ReadService.getNiveaux(anneeLabel)

GET /read/niveaux/:niveau/classes
Query: dateNaissance?, anneeLabel?
→ ReadService.getClassesParNiveau(niveau décodé URI, dateNaissance, anneeLabel)
```

### Professeurs

```
GET /read/professeurs
Query: page?, limit?, search?
→ ReadService.getProfesseursList(page, limit, search)

GET /read/professeurs/actifs
→ ReadService.getProfesseursActifs()
ATTENTION: route /actifs avant /:id

GET /read/professeurs/:id
→ ReadService.getProfesseurDetail(id)
Throws NotFoundException si absent
```

### Données formulaires

```
GET /read/create-classe
→ ReadService.getCreateClasseData()
Retourne: { salles, niveaux, annee_active }

GET /read/create-eleve
→ ReadService.getCreateEleveData()
Retourne: { classes, annee_active }
```

---

## Gestion des erreurs

- `NotFoundException` (404) levée si ressource non trouvée
- Toutes les autres erreurs remontent en 500 (comportement NestJS par défaut)
- Les méthodes de `ReadService` retournent `null` si non trouvé → le contrôleur throw NotFoundException
