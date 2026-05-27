# ReadService

**Fichier source :** `server/src/read/read.service.ts`

Service central de lecture. Retourne des view-models pré-composés (données jointes, paginées, filtrées) optimisés pour chaque page frontend.

---

## Principe

- Toutes les méthodes sont en lecture seule (aucune mutation)
- Les requêtes sont optimisées avec les index MongoDB
- Le paramètre `anneeLabel` active le mode archive : les filtres changent d'`annee_active` vers l'année demandée
- Retourne `null` si la ressource principale n'existe pas

---

## Méthodes

### getDashboard(page, limit, anneeLabel?)

```typescript
async getDashboard(page: number, limit: number, anneeLabel?: string): Promise<{
  stats: { nb_classes, nb_eleves, nb_matieres, nb_salles }
  classes: { items, total, page, pages }
  convocations: Convocation[]       // non effectuées
  recent_eleves: any[]              // 5 derniers inscrits
  annee_active: string | null
}>
```

Requêtes parallèles avec `Promise.all` :
- `countDocuments` sur classes, eleves, matieres, salles
- `find` classes paginées avec filtre annee
- `find` convocations non effectuées
- `find` derniers élèves (triés par `createdAt desc`)

---

### getClassesList(page, limit, search, niveau, anneeLabel?)

```typescript
async getClassesList(...): Promise<{
  items: Array<ClasseAvecStats>     // nb_eleves, taux calculés
  total: number; page: number; pages: number
  niveaux: string[]                 // valeurs distinctes pour le filtre
}>
```

- Filtre par `annee_scolaire` (active ou archivée)
- Filtre optionnel par `niveau`
- Recherche sur `nom` (regex insensible à la casse)
- `nb_eleves` calculé par lookup ou aggregation

---

### getClasseEleves(id, page, limit, search, eleveId, anneeLabel?)

```typescript
async getClasseEleves(id: string, ...): Promise<{
  classe: Classe & { nb_eleves: number; taux: number }
  eleves: { items, total, page, pages }
} | null>
```

- Retourne `null` si la classe n'existe pas
- `eleveId` : filtre pour un élève spécifique (utilisé en deeplink)

---

### getElevesList(page, limit, search, classeId, eleveId, anneeLabel?)

Recherche combinée sur `nom` et `prenom` (regex). Jointure avec la classe pour avoir `classe_nom`.

---

### getMatieresList(page, limit, niveau)

- Si `niveau` est fourni : filtre les matières liées à ce niveau via `Niveau.matiere_ids`

---

### getSallesList(page, limit, type, search)

- Filtre par `type` si fourni
- Recherche sur `nom` (regex)
- Retourne stats d'occupation si disponibles

---

### getSalleDetail(id)

```typescript
async getSalleDetail(id: string): Promise<{
  salle: Salle
  stats: SalleStats
  creneaux: Creneau[]    // créneaux utilisant cette salle
} | null>
```

---

### getPlanningClasses(anneeLabel?)

Retourne toutes les classes actives de l'année courante (ou archivée) avec leur niveau, triées par niveau puis nom.

---

### getPlanningClasse(id)

```typescript
async getPlanningClasse(id: string): Promise<{
  classe: Classe
  creneaux: Creneau[]
  matieres: Matiere[]          // matières disponibles pour la classe
  professeurs: Professeur[]    // professeurs affectés
  salles: Salle[]              // toutes les salles actives
} | null>
```

---

### getNotesFilters(anneeLabel?)

```typescript
async getNotesFilters(anneeLabel?: string): Promise<{
  classes: Array<{ id, nom, niveau }>
  matieres: Array<{ id, nom, code }>
  annee_active: string | null
}>
```

Données pour alimenter les filtres de la page de saisie des notes.

---

### getNotesEleves(classeId, matiereId, trimestre, anneeLabel?)

```typescript
async getNotesEleves(...): Promise<{
  eleves: Array<{
    id, nom, prenom
    note_ds?: { id, valeur, date }
    note_evaluation?: { id, valeur, date }
    moyenne?: number
  }>
  stats: { nb_notes, moyenne_classe, min, max, nb_eleves }
}>
```

- Charge tous les élèves de la classe
- Pour chaque élève, cherche les notes (type DS et Évaluation) non annulées
- Calcule les stats en JavaScript (pas d'aggregation)

---

### getBulletin(eleveId, trimestre, anneeLabel?)

```typescript
async getBulletin(eleveId: string, trimestre: number, anneeLabel?: string): Promise<{
  eleve: Eleve & { classe_nom, classe_niveau, annee_scolaire }
  trimestre: number
  matieres: BulletinMatiere[]
  moyenne_generale: number | null
} | null>
```

Algorithme :
1. Charger l'élève et sa classe
2. Charger les matières du niveau de la classe
3. Pour chaque matière, trouver les notes DS et Évaluation du trimestre
4. Calculer la moyenne par matière : `(ds + eval) / 2` (ou la seule note dispo)
5. Calculer la moyenne générale pondérée : `Σ(moyenne_m × coeff_m) / Σ(coeff_m)`

---

### getEleveFiche(id, anneeLabel?)

```typescript
async getEleveFiche(id: string, anneeLabel?: string): Promise<{
  eleve: Eleve & { classe_nom, classe_niveau }
  absences: Absence[]
  avertissements: Avertissement[]
  convocations: Convocation[]
  historique_classes: HistoriqueClasse[]
  exclusion?: EleveExclu
  depart?: EleveQuitte
} | null>
```

Requêtes parallèles pour toutes les données de suivi.

---

### getEvaluationsList(classeId?, matiereId?, trimestre?, statut?, page, limit, anneeLabel?)

Retourne la liste paginée avec les données de filtres (classes, matières distinctes).

---

### getEvaluationDetail(id)

```typescript
async getEvaluationDetail(id: string): Promise<{
  evaluation: Evaluation & { classe_nom, matiere_nom }
  notes: Array<{ eleve_id, nom, prenom, valeur, absent }>
} | null>
```

Jointure : charger les élèves de la classe pour avoir nom/prénom à côté de chaque note.

---

### getPeriodes(annee_scolaire)

Retourne les 6 périodes (3 trimestres × 2 types) de l'année. Crée les périodes manquantes si nécessaires (lazy init).

---

### getActivePeriode()

Retourne la période dont les dates encadrent la date du jour.

---

### getAnneeSnapshot(id)

```typescript
async getAnneeSnapshot(id: string): Promise<SnapshotData | null>
```

Construit un snapshot complet de l'année scolaire pour le mode archive :
- Classes, élèves, matières, notes, créneaux, évaluations
- Tout filtré par `annee_scolaire = annee.label`
- Retourné en un seul objet JSON (peut être lourd)

---

### getNiveaux(anneeLabel?)

Retourne les niveaux avec leurs matières et le nombre de classes associées.

---

### getClassesParNiveau(niveau, dateNaissance?, anneeLabel?)

Utilisé dans le formulaire d'affectation de classe pour un élève. Si `dateNaissance` est fourni, filtre les classes dont le niveau est adapté à l'âge.

---

### getProfesseursList(page, limit, search)

---

### getProfesseurDetail(id)

```typescript
async getProfesseurDetail(id: string): Promise<{
  professeur: Professeur
  assignments: Array<{ classe_nom, classe_niveau, matiere_nom, matiere_code }>
  nb_eleves: number
} | null>
```

---

### getProfesseursActifs()

Retourne tous les professeurs avec `statut = 'actif'`, sans pagination.

---

### getCreateClasseData()

```typescript
async getCreateClasseData(): Promise<{
  salles: Salle[]
  niveaux: string[]
  annee_active: string | null
}>
```

---

### getCreateEleveData()

```typescript
async getCreateEleveData(): Promise<{
  classes: Array<{ id, nom, niveau }>
  annee_active: string | null
}>
```

---

## Optimisations

- Requêtes indépendantes parallélisées avec `Promise.all([...])`
- Index MongoDB ciblés pour chaque requête fréquente
- `lean()` Mongoose sur toutes les requêtes (retourne POJO, pas d'instance Mongoose)
- `select()` limité aux champs nécessaires
- Pas de populate Mongoose — jointures manuelles en JS pour contrôle fin
