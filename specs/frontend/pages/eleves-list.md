# Page ElevesList

**Route :** `/eleves`
**Dossier :** `src/pages/ElevesList/`
**Fichier principal :** `ElevesList.tsx`

---

## Rôle

Liste tous les élèves de l'établissement avec recherche, filtrage par classe, et pagination.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `ElevesList.tsx` | Page principale |
| `ElevesListTable.tsx` | Tableau des élèves |
| `ElevesFiltersBar.tsx` | Barre de filtres (recherche + classe) |

---

## Données requises

```typescript
// Hook: useElevesListData(page, search, classeId, eleveId)
// Endpoint: GET /read/eleves?page=N&limit=12&search=...&classeId=...&anneeLabel=?

interface ElevesListData {
  items: Array<{
    id: string; nom: string; prenom: string
    date_naissance: string; genre: 'M' | 'F'
    classe_id: string; classe_nom: string; classe_niveau: string
    statut: EleveStatut; email?: string; telephone?: string
  }>
  total: number; page: number; pages: number
  classes: Array<{ id: string; nom: string; niveau: string }>  // pour le filtre
}
```

---

## Structure UI

```
PageHeader "Élèves"
  └─ Bouton "Nouvel élève" → /eleves/nouveau

ElevesFiltersBar
  ├─ SearchInput (recherche nom/prénom, debounce 300ms)
  └─ Select classe

ElevesListTable
  ├─ Colonnes: Nom, Prénom, Classe, Niveau, Statut, Actions
  └─ Actions: "Fiche" → /eleves/:id, "Bulletin" → /eleves/:id/bulletin

Pagination
```

---

## ElevesListTable

- Colonnes : Nom complet, Classe, Niveau, Genre, Statut (badge), Actions
- Statut badge : actif=vert, exclu=rouge, parti=gris
- Chaque ligne cliquable → `/eleves/:id`
- Tri possible par nom (alphab.)

---

## État local

```typescript
const [page, setPage] = useState(1)
const [search, setSearch] = useState('')
const [classeId, setClasseId] = useState('')
```

Tout changement de filtre remet `page = 1`.

---

## Dépendances

- `src/hooks/usePageData.ts` → `useElevesListData`
- `src/components/ui/PageHeader.tsx`
- `src/components/shared/Table.tsx`
- `src/components/shared/Badge.tsx`
- `src/components/shared/Pagination.tsx`
- `src/components/shared/SearchInput.tsx`
- `src/components/shared/Select.tsx`
