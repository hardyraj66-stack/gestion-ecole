# Page ClasseEleves

**Route :** `/classes/:id/eleves`
**Dossier :** `src/pages/ClasseEleves/`
**Fichier principal :** `ClasseEleves.tsx`

---

## Rôle

Liste les élèves d'une classe spécifique avec les informations de la classe en bandeau et un tableau des élèves avec recherche.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `ClasseEleves.tsx` | Page principale |
| `ClasseInfoBar.tsx` | Bandeau d'infos de la classe (niveau, salle, capacité, taux) |
| `ElevesTable.tsx` | Tableau des élèves de la classe |

---

## Paramètres de route

```typescript
const { id } = useParams()  // id de la classe
```

---

## Données requises

```typescript
// Hook: useClasseElevesData(classeId, page, search, eleveId)
// Endpoint: GET /read/classes/:id/eleves?page=N&limit=10&search=...&eleveId=...&anneeLabel=?

interface ClasseElevesData {
  classe: {
    id: string; nom: string; niveau: string; annee_scolaire: string
    capacite: number; salle: string; salle_type: SalleType
    nb_eleves: number; taux: number
  }
  eleves: {
    items: Array<{
      id: string; nom: string; prenom: string
      date_naissance: string; genre: 'M' | 'F'
      statut: EleveStatut; email?: string; telephone?: string
    }>
    total: number; page: number; pages: number
  }
}
```

---

## Structure UI

```
PageHeader "[Nom Classe]"
  ├─ Breadcrumb: Classes > [Nom Classe]
  └─ Bouton "Voir le planning" → /classes/:id/planning

ClasseInfoBar
  ├─ Niveau (badge)
  ├─ Salle assignée
  ├─ Capacité / Nb élèves
  └─ Taux de remplissage (barre + %)

SearchInput (filtre élèves)

ElevesTable
  ├─ Colonnes: Nom, Prénom, Date naissance, Genre, Statut, Actions
  └─ Actions par ligne: voir fiche → /eleves/:id, voir bulletin → /eleves/:id/bulletin

Pagination
```

---

## ElevesTable

- Affiche les colonnes : Nom, Prénom, Date naissance, Genre, Statut
- Statut avec badge coloré : `actif`=vert, `exclu`=rouge, `parti`=gris
- Boutons par ligne : "Fiche" → `/eleves/:id`, "Bulletin" → `/eleves/:id/bulletin`
- Ligne cliquable entière → `/eleves/:id`

---

## État local

```typescript
const [page, setPage] = useState(1)
const [search, setSearch] = useState('')
```

---

## Dépendances

- `src/hooks/usePageData.ts` → `useClasseElevesData`
- `src/components/ui/PageHeader.tsx`
- `src/components/shared/InfoBar.tsx`
- `src/components/shared/SearchInput.tsx`
- `src/components/shared/Table.tsx`
- `src/components/shared/Badge.tsx`
- `src/components/shared/Pagination.tsx`
