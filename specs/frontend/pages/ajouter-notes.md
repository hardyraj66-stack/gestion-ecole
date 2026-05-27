# Page AjouterNotes

**Route :** `/notes`
**Dossier :** `src/pages/AjouterNotes/`
**Fichier principal :** `AjouterNotes.tsx`

---

## Rôle

Interface de saisie des notes pour une classe, une matière, et un trimestre donnés. Affiche les élèves de la classe avec leurs notes actuelles et permet la saisie/modification.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `AjouterNotes.tsx` | Page principale, orchestration |
| `NotesFilters.tsx` | Sélecteurs classe / matière / trimestre / type de note |
| `NotesStatsBar.tsx` | Statistiques : moyenne classe, nb notes saisies, min/max |
| `NotesTable.tsx` | Tableau des élèves avec champs de saisie |

---

## Données requises

### Initialisation des filtres
```typescript
// Hook: useNotesFiltersData()
// Endpoint: GET /read/notes/filters?anneeLabel=?
interface NotesFiltersData {
  classes: Array<{ id: string; nom: string; niveau: string }>
  matieres: Array<{ id: string; nom: string; code: string }>
  annee_active: string
}
```

### Notes des élèves (après sélection filtres)
```typescript
// readApi.notesEleves(classeId, matiereId, trimestre, anneeLabel?)
// Endpoint: GET /read/notes/eleves?classeId=...&matiereId=...&trimestre=N
interface NotesElevesData {
  eleves: Array<{
    id: string; nom: string; prenom: string
    note_ds?: { id: string; valeur: number; date: string }
    note_evaluation?: { id: string; valeur: number; date: string }
    moyenne?: number
  }>
  stats: {
    nb_notes: number; moyenne_classe: number
    min: number; max: number; nb_eleves: number
  }
}
```

---

## Structure UI

```
PageHeader "Saisie des notes"

NotesFilters
  ├─ Select classe (obligatoire)
  ├─ Select matière (obligatoire)
  ├─ Select trimestre (1/2/3)
  └─ Select type de note (DS / Évaluation)

[Si filtres complets:]

NotesStatsBar
  ├─ Moyenne classe
  ├─ Notes saisies / Total élèves
  └─ Min / Max

NotesTable
  ├─ Colonnes: Nom, Prénom, Note (input), Actions
  └─ Barre de sauvegarde collective ("Tout enregistrer")
```

---

## NotesTable

- Une ligne par élève de la classe
- Champ `<input type="number" min="0" max="20" step="0.5">` par élève
- Si note existante : valeur pré-remplie
- Saisie → bouton "Enregistrer" par ligne (crée ou met à jour)
- Note annulée : badge "Annulée" + bouton "Réactiver"
- Bouton "Annuler la note" par note existante

---

## Logique de saisie

```typescript
// Création: NoteContext.create({ eleve_id, matiere_id, trimestre, valeur, type, date })
// Mise à jour: NoteContext.update(noteId, { valeur })
// Annulation: NoteContext.annuler(noteId)
```

---

## État local

```typescript
const [classeId, setClasseId] = useState('')
const [matiereId, setMatiereId] = useState('')
const [trimestre, setTrimestre] = useState<Trimestre>(1)
const [typeNote, setTypeNote] = useState<PeriodeType>('ds')
const [saving, setSaving] = useState<Record<string, boolean>>({})
```

---

## Dépendances

- `src/hooks/usePageData.ts` → `useNotesFiltersData`
- `src/services/readApi.ts` → `notesEleves`
- `src/contexts/NoteContext.tsx`
- `src/components/shared/Select.tsx`
- `src/components/shared/Table.tsx`
- `src/components/shared/Input.tsx`
