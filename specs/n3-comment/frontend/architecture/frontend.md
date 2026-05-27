# Architecture Frontend

> **Couche** : N3 — COMMENT (frontend)
> **Ce fichier contient** : stack technique, structure des dossiers, patterns de données, routing, temps réel
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails écrans (→ N2b)

---

## Stack technique

| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 19 | UI library |
| Vite | 7 | Bundler + dev server |
| TypeScript | 5 | Typage statique |
| React Router | v7 | Routing côté client |
| Tailwind CSS | v4 | Styles utilitaires |
| Socket.IO client | — | Temps réel |
| react-i18next | — | Internationalisation (fr/en/mg) |
| vite-plugin-singlefile | — | Bundle en un fichier HTML unique |

---

## Structure des dossiers

```
src/
├── App.tsx                    # Routes React Router (26 routes)
├── main.tsx                   # Point d'entrée, montage AppProviders
├── config/
│   └── api.ts                 # BASE_URL, SOCKET_URL
├── types/
│   └── index.ts               # Tous les types TypeScript (entités + vues)
├── contexts/
│   ├── AppProviders.tsx        # Pile de tous les contextes
│   ├── ViewingContext.tsx      # Mode archive (isViewingArchive, viewingLabel)
│   ├── ClasseContext.tsx       # CRUD classes
│   ├── EleveContext.tsx        # CRUD élèves
│   ├── MatiereContext.tsx      # CRUD matières
│   ├── NoteContext.tsx         # CRUD notes
│   ├── PlanningContext.tsx     # CRUD créneaux
│   ├── SalleContext.tsx        # CRUD salles
│   └── ...                    # autres contextes domaine
├── hooks/
│   ├── usePageData.ts          # usePageFetch<T> + tous les hooks page-spécifiques
│   └── useData.ts              # Ancien hook multi-entités (legacy)
├── services/
│   ├── readApi.ts              # Toutes les méthodes GET /read/*
│   └── socketService.ts        # Singleton Socket.IO
├── pages/
│   ├── Dashboard/
│   ├── Classes/
│   ├── Eleves/
│   ├── Notes/
│   ├── Planning/
│   ├── Salles/
│   ├── Matieres/
│   ├── Niveaux/
│   ├── Professeurs/
│   ├── Evaluations/
│   ├── AnneeScolaire/
│   └── Parametres/
├── components/
│   ├── shared/                 # Primitives réutilisables (Button, Input, Select, Table…)
│   ├── ui/                     # Blocs UI (PageHeader, StatCard, EmptyState, Badge)
│   └── Layout/                 # Layout principal (nav, sidebar, bandeau archive)
├── styles/                     # CSS Tailwind + variables
├── utils/
│   └── cn.ts                   # Utilitaire cn() = clsx + tailwind-merge
└── i18n/
    └── locales/               # Fichiers de traduction fr.json, en.json, mg.json
```

**Alias de chemin** : `@/` → `src/`

---

## Pattern de données — Lecture (CQRS-inspired)

### usePageFetch<T>

Hook central dans `src/hooks/usePageData.ts`. Gère :
- L'appel à `readApi` via une fonction getter
- L'état de chargement (`loading`, `error`)
- La pagination (`page`, `limit`)
- Le re-fetch automatique sur événement Socket.IO (`channel`)
- La transparence mode archive (injecte `?anneeLabel=` si `ViewingContext.isViewingArchive`)

```typescript
const { data, loading, error, refetch } = usePageFetch<DashboardData>(
  () => readApi.getDashboard(),
  { channel: 'all' }
);
```

**Hooks page-spécifiques** (tous dans `usePageData.ts`) :

| Hook | Endpoint | Canal |
|------|---------|-------|
| `useDashboardData` | `GET /read/dashboard` | `all` |
| `useClassesListData` | `GET /read/classes` | `classes` |
| `useClasseElevesData` | `GET /read/classes/:id/eleves` | `eleves` |
| `useElevesListData` | `GET /read/eleves` | `eleves` |
| `useMatieresListData` | `GET /read/matieres` | `matieres` |
| `useSallesListData` | `GET /read/salles` | `salles` |
| `usePlanningClasses` | `GET /read/planning/classes` | `planning` |
| `usePlanningClasse` | `GET /read/planning/classes/:id` | `planning` |
| `useNotesPageData` | `GET /read/notes` | `notes` |
| `useNotesFiltersData` | `GET /read/notes/filters` | `notes` |
| `useBulletinData` | `GET /read/eleves/:id/bulletin` | `notes` |
| `useEleveFicheData` | `GET /read/eleves/:id/fiche` | `eleves` |
| `useNiveauxListData` | `GET /read/niveaux` | `niveaux` |
| `useProfesseursListData` | `GET /read/professeurs` | `professeurs` |
| `useProfesseurDetailData` | `GET /read/professeurs/:id` | `professeurs` |

---

## Pattern de données — Écriture

Les contextes de domaine (ex: `ClasseContext`) exposent des méthodes `create`, `update`, `delete` qui appellent directement les endpoints REST via `fetch`. Chaque méthode déclenche ensuite un refresh via Socket.IO (côté backend → événement → frontend `notifyDataChange`).

---

## Temps réel — Socket.IO

**Flux** :
1. Backend émet un événement (ex: `classe:created`)
2. `src/services/socketService.ts` écoute l'événement
3. `notifyDataChange('classes')` est appelé
4. Tous les `usePageFetch` abonnés au canal `classes` déclenchent un re-fetch silencieux

**Canaux** : `classes`, `eleves`, `matieres`, `notes`, `planning`, `salles`, `annees`, `niveaux`, `professeurs`, `evaluations`, `periodes`, `all`

---

## Mode archive

Quand `ViewingContext.isViewingArchive = true` :
- `usePageFetch` injecte `?anneeLabel=XXXX-XXXX` dans tous les appels read
- Les formulaires de création/édition sont masqués ou désactivés
- Un bandeau orange s'affiche en permanence

---

## Routing

26 routes sous `<Layout>` via React Router v7. Routes principales :

| Route | Page |
|-------|------|
| `/` | Dashboard |
| `/classes` | Liste classes |
| `/classes/:id/eleves` | Élèves d'une classe |
| `/classes/creer` | Créer une classe |
| `/eleves` | Liste élèves |
| `/eleves/:id` | Fiche élève |
| `/eleves/inscrire` | Inscrire un élève |
| `/notes` | Saisie notes |
| `/planning` | Planning global |
| `/planning/:classeId` | Planning d'une classe |
| `/salles` | Liste salles |
| `/salles/:id` | Détail salle |
| `/matieres` | Liste matières |
| `/niveaux` | Liste niveaux |
| `/professeurs` | Liste professeurs |
| `/professeurs/:id` | Détail professeur |
| `/evaluations` | Liste évaluations |
| `/evaluations/:id` | Détail évaluation |
| `/evaluations/periodes` | Périodes d'évaluation |
| `/annee-scolaire` | Gestion année scolaire |
| `/parametres` | Paramètres |

---

## Internationalisation

- Framework : `react-i18next`
- Langues : Français (`fr`), Anglais (`en`), Malagasy (`mg`)
- Fichiers : `src/i18n/locales/fr.json`, `en.json`, `mg.json`
- Persistance de la langue sélectionnée : IndexedDB via `settingsDB.ts`

---

## Build

- `npm run build` → Vite produit un fichier HTML unique (vite-plugin-singlefile)
- Toutes les dépendances sont inlinées dans le HTML — déployable sans serveur web
