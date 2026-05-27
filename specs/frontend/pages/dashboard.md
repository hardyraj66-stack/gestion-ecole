# Page Dashboard

**Route :** `/dashboard`
**Dossier :** `src/pages/Dashboard/`
**Fichier principal :** `Dashboard.tsx`

---

## Rôle

Page d'accueil de l'application. Affiche une vue synthétique de l'établissement : statistiques globales, liste des classes, convocations à traiter, et élèves récemment ajoutés.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `Dashboard.tsx` | Page principale, orchestration et layout |
| `ClassesTable.tsx` | Tableau paginé des classes avec taux de remplissage |
| `ConvocationsWidget.tsx` | Liste des convocations en attente |
| `QuickActions.tsx` | Boutons d'accès rapide aux actions courantes |
| `RecentEleves.tsx` | Derniers élèves inscrits |

---

## Données requises

```typescript
// Hook: useDashboardData(classesPage)
// Endpoint: GET /read/dashboard?classesPage=N&classesLimit=5&anneeLabel=?

interface DashboardData {
  stats: {
    nb_classes: number
    nb_eleves: number
    nb_matieres: number
    nb_salles: number
  }
  classes: {
    items: Array<{
      id: string; nom: string; niveau: string
      nb_eleves: number; capacite: number; taux: number
    }>
    total: number; page: number; pages: number
  }
  convocations: Convocation[]         // non effectuées
  recent_eleves: Array<{
    id: string; nom: string; prenom: string
    classe_nom: string; date_inscription: string
  }>
  annee_active: string | null
}
```

---

## Structure UI

```
PageHeader "Tableau de bord"
  └─ [QuickActions] — boutons rapides

StatCards (4 cartes en grille)
  ├─ Nombre de classes
  ├─ Nombre d'élèves
  ├─ Nombre de matières
  └─ Nombre de salles

Grille 2 colonnes:
  ├─ ClassesTable (paginé, 5 par page)
  └─ ConvocationsWidget

RecentEleves (liste)
```

---

## Interactions

- **ClassesTable** : pagination locale (boutons Précédent/Suivant), re-fetch via `useDashboardData(classesPage)`
- **ClassesTable ligne** : clic → navigation `/classes/:id/eleves`
- **QuickActions** : liens vers `/classes/nouvelle`, `/eleves/nouveau`, `/notes`, `/planning`
- **ConvocationsWidget** : chaque convocation affiche l'élève, la date, un badge "effectuée/en attente"
- **RecentEleves** : clic sur un élève → `/eleves/:id`

---

## État local

```typescript
const [classesPage, setClassesPage] = useState(1)
```

---

## Mode archive

En mode archive, `useDashboardData` passe `anneeLabel` → les stats et classes reflètent l'année consultée.

---

## Dépendances

- `src/hooks/usePageData.ts` → `useDashboardData`
- `src/components/ui/StatCard.tsx`
- `src/components/ui/PageHeader.tsx`
- `src/components/shared/Pagination.tsx`
