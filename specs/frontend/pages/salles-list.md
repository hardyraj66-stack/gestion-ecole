# Page SallesList

**Route :** `/salles`
**Dossier :** `src/pages/SallesList/`
**Fichier principal :** `SallesList.tsx`

---

## Rôle

Liste toutes les salles de l'établissement. Permet la recherche, le filtrage par type, la consultation du détail, et la modification inline.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `SallesList.tsx` | Page principale |
| `SalleCard.tsx` | Carte d'une salle |
| `SalleDetailModal.tsx` | Modal détail (lecture) |
| `SalleEditModal.tsx` | Modal édition |

---

## Données requises

```typescript
// Hook: useSallesListData(page, type, search)
// Endpoint: GET /read/salles?page=N&limit=10&type=...&search=...

interface SallesListData {
  items: Array<{
    id: string; nom: string; capacite: number; description: string
    type: TypeSalle; equipements: Equipement[]
    accessible_pmr: boolean; batiment: string; etage: string
    stats?: SalleStats
  }>
  total: number; page: number; pages: number
}
```

---

## Structure UI

```
PageHeader "Salles"
  └─ Bouton "Nouvelle salle" → /salles/nouvelle

FilterBar
  ├─ SearchInput (nom de salle)
  └─ Select type (standard/laboratoire/informatique/sport/arts/amphi/autre)

Grille SalleCard (3 colonnes)

Pagination
```

---

## SalleCard

Affiche :
- Nom de la salle
- Type (badge avec icône)
- Capacité
- Bâtiment + Étage
- Équipements (icônes)
- Accessible PMR (icône fauteuil)
- Deux boutons : "Détail", "Modifier"

---

## SalleDetailModal

- Ouvre en modale au clic "Détail"
- Charge `readApi.salleDetail(id)` pour les stats d'occupation
- Affiche : toutes les infos de la salle + statistiques (créneaux/semaine, heures, taux d'occupation)

---

## SalleEditModal

- Formulaire de modification de salle
- Mêmes champs que CreateSalle
- Soumission : `SalleContext.update(id, data)`
- Bouton "Supprimer" (avec ConfirmDialog) : `SalleContext.delete(id)`

---

## État local

```typescript
const [page, setPage] = useState(1)
const [type, setType] = useState('')
const [search, setSearch] = useState('')
const [detailSalle, setDetailSalle] = useState<string | null>(null)
const [editSalle, setEditSalle] = useState<Salle | null>(null)
```

---

## Dépendances

- `src/hooks/usePageData.ts` → `useSallesListData`
- `src/contexts/SalleContext.tsx`
- `src/services/readApi.ts` → `salleDetail`
- `src/components/shared/Modal.tsx`
- `src/components/shared/ConfirmDialog.tsx`
