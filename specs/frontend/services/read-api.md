# Service readApi

**Fichier source :** `src/services/readApi.ts`

Facade de lecture unique pour tous les appels GET vers le backend. Tous les appels passent par le préfixe `/read`.

---

## Rôle

- Centralise tous les appels HTTP de lecture
- Expose une méthode par vue/page de l'application
- Gère la construction des query strings (`qs()` helper interne)
- Retourne `null` en cas d'erreur réseau (pas d'exception propagée)
- Accepte un paramètre `anneeLabel` sur la majorité des méthodes pour le mode archive

---

## Configuration

```typescript
import { API_BASE_URL } from '../config/api'
// API_BASE_URL = 'http://localhost:3000'
```

---

## Helper interne

```typescript
function qs(params: Record<string, string | number | undefined>): string
// Construit un query string. Filtre les valeurs undefined et les chaînes vides.
// Exemple: qs({ page: 1, search: 'alice' }) → '?page=1&search=alice'
```

---

## Méthodes

### Dashboard
```typescript
readApi.dashboard(classesPage?: number, classesLimit?: number, anneeLabel?: string)
// → GET /read/dashboard?classesPage=N&classesLimit=N&anneeLabel=XXXX
```

### Classes
```typescript
readApi.classesList(page?, limit?, search?, niveau?, anneeLabel?)
// → GET /read/classes?...

readApi.classeEleves(id, page?, limit?, search?, eleveId?, anneeLabel?)
// → GET /read/classes/:id/eleves?...
```

### Élèves
```typescript
readApi.elevesList(page?, limit?, search?, classeId?, eleveId?, anneeLabel?)
// → GET /read/eleves?...

readApi.eleveFiche(id, anneeLabel?)
// → GET /read/eleves/:id/fiche?anneeLabel=...
```

### Matières
```typescript
readApi.matieresList(page?, limit?, niveau?)
// → GET /read/matieres?...
```

### Salles
```typescript
readApi.sallesList(page?, limit?, type?, search?)
// → GET /read/salles?...

readApi.salleDetail(id)
// → GET /read/salles/:id
```

### Planning
```typescript
readApi.planningClasses(anneeLabel?)
// → GET /read/planning/classes?anneeLabel=...

readApi.planningClasse(id)
// → GET /read/planning/classe/:id
```

### Notes
```typescript
readApi.notesPage()
// → GET /read/notes

readApi.notesFilters(anneeLabel?)
// → GET /read/notes/filters?anneeLabel=...

readApi.notesEleves(classeId, matiereId, trimestre, anneeLabel?)
// → GET /read/notes/eleves?classeId=...&matiereId=...&trimestre=N&anneeLabel=...
```

### Bulletin
```typescript
readApi.bulletin(eleveId, trimestre, anneeLabel?)
// → GET /read/bulletin/:eleveId?trimestre=N&anneeLabel=...
```

### Années scolaires
```typescript
readApi.anneeSnapshot(id)
// → GET /read/annees/:id/snapshot
```

### Niveaux
```typescript
readApi.niveaux(anneeLabel?)
// → GET /read/niveaux?anneeLabel=...

readApi.classesParNiveau(niveau, dateNaissance?, anneeLabel?)
// → GET /read/niveaux/:niveau/classes?...
// Le niveau est encodé URI (encodeURIComponent)
```

### Professeurs
```typescript
readApi.professeurs(page?, limit?, search?)
// → GET /read/professeurs?page=1&limit=20&search=...

readApi.professeursActifs()
// → GET /read/professeurs/actifs

readApi.professeur(id)
// → GET /read/professeurs/:id
```

### Périodes
```typescript
readApi.periodes(annee_scolaire)
// → GET /read/periodes?annee_scolaire=...

readApi.activePeriode()
// → GET /read/periodes/active
```

### Evaluations
```typescript
readApi.evaluationsList(classeId?, matiereId?, trimestre?, statut?, page?, anneeLabel?)
// → GET /read/evaluations?...

readApi.evaluationDetail(id)
// → GET /read/evaluations/:id
```

### Données formulaires
```typescript
readApi.createClasseData()
// → GET /read/create-classe
// Retourne: { salles, niveaux, annee_active }

readApi.createEleveData()
// → GET /read/create-eleve
// Retourne: { classes, annee_active }
```

---

## Pattern d'erreur

```typescript
async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/read${path}`)
    if (res.ok) return res.json()
    return null
  } catch {
    return null
  }
}
```

En cas d'erreur réseau ou HTTP non-ok, retourne `null`. Le hook `usePageFetch` détecte `null` et passe `error = true`.

---

## Dépendances

- `src/config/api.ts` → `API_BASE_URL`
- Utilisé exclusivement par `src/hooks/usePageData.ts`
