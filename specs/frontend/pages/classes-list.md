# Page ClassesList

**Route :** `/classes`
**Dossier :** `src/pages/ClassesList/`
**Fichier principal :** `ClassesList.tsx`

---

## Rôle

Affiche toutes les classes de l'établissement sous forme de cartes, avec filtrage par niveau et recherche par nom.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `ClassesList.tsx` | Page principale avec filtres et grille de cartes |
| `ClasseCard.tsx` | Carte individuelle d'une classe |

---

## Données requises

```typescript
// Hook: useClassesListData(page, search, niveau)
// Endpoint: GET /read/classes?page=N&limit=8&search=...&niveau=...&anneeLabel=?

interface ClassesListData {
  items: Array<{
    id: string; nom: string; niveau: string
    annee_scolaire: string; capacite: number; salle: string
    salle_type: SalleType; nb_eleves: number; taux: number
    actif: boolean
  }>
  total: number; page: number; pages: number
  niveaux: string[]    // pour le filtre de niveau
}
```

---

## Structure UI

```
PageHeader "Classes"
  └─ Bouton "Nouvelle classe" → /classes/nouvelle

FilterBar
  ├─ SearchInput (debounce 300ms)
  └─ Select niveau (options dynamiques depuis niveaux[])

Grille de ClasseCard (3 colonnes)

Pagination
```

---

## ClasseCard

Affiche pour chaque classe :
- Nom de la classe (ex: "6ème A")
- Niveau (badge)
- Salle assignée (ou "Variable" si salle_type=variable)
- Nombre d'élèves / Capacité
- Barre de progression du taux de remplissage (couleur selon taux : vert/orange/rouge)
- Deux boutons : "Voir les élèves" → `/classes/:id/eleves`, "Planning" → `/classes/:id/planning`

---

## État local

```typescript
const [page, setPage] = useState(1)
const [search, setSearch] = useState('')
const [niveau, setNiveau] = useState('')
```

La recherche reset la page à 1. Le filtre niveau reset la page à 1.

---

## Interactions

- Clic "Voir les élèves" → `/classes/:id/eleves`
- Clic "Planning" → `/classes/:id/planning`
- Clic "Nouvelle classe" → `/classes/nouvelle`
- Pagination : boutons Précédent/Suivant + numéros de page

---

## Dépendances

- `src/hooks/usePageData.ts` → `useClassesListData`
- `src/components/ui/PageHeader.tsx`
- `src/components/shared/FilterBar.tsx`
- `src/components/shared/SearchInput.tsx`
- `src/components/shared/Select.tsx`
- `src/components/shared/Pagination.tsx`
- `src/components/shared/ProgressBar.tsx`
