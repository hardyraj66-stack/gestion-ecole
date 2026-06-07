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
frontend/src/
├── App.tsx                    # Routes React Router (voir table Routing)
├── main.tsx                   # Point d'entrée, montage AuthProvider + AppProviders
├── config/
│   └── api.ts                 # API_BASE_URL, SOCKET_URL
├── types/
│   └── index.ts               # Tous les types TypeScript (entités + vues)
├── contexts/
│   ├── AppProviders.tsx        # Pile de tous les contextes domaine
│   ├── AuthContext.tsx         # Session, login/logout, rôles (monté hors AppProviders)
│   ├── ViewingContext.tsx      # Mode archive (isViewingArchive, viewingLabel)
│   ├── SettingsContext.tsx     # Thème, couleur, langue
│   ├── ClasseContext / EleveContext / MatiereContext / NoteContext
│   ├── PlanningContext / SalleContext / AnneeContext
│   ├── NiveauContext / ProfesseurContext / TeacherAssignmentContext / PeriodeContext
│   └── …                       # contextes domaine = méthodes d'écriture + abonnements socket
├── hooks/
│   ├── usePageData.ts          # usePageFetch<T> + tous les hooks page-spécifiques
│   └── useData.ts              # Ancien hook multi-entités (legacy)
├── services/
│   ├── readApi.ts              # Toutes les méthodes GET /read/*
│   ├── socketService.ts        # Singleton Socket.IO (transmet le token d'auth)
│   ├── httpClient.ts           # Intercepteur global fetch : Bearer token + gestion 401
│   └── authStorage.ts          # Lecture/écriture du token en localStorage (clé auth_token)
├── pages/
│   ├── Login/                  # Écran de connexion (route publique /login)
│   ├── Users/                  # Gestion des comptes (UsersList, admin)
│   ├── Dashboard/ · Classes/ · Eleves/ · Notes/ · Planning/ · Salles/
│   ├── Matieres/ · Niveaux/ · Professeurs/ · evaluations/
│   ├── AnneeScolaire/ · Parametres/ · …
├── components/
│   ├── shared/                 # Primitives réutilisables (Button, Input, Select, Table…)
│   ├── ui/                     # Blocs UI (PageHeader, StatCard, EmptyState, PageLoader, Badge)
│   ├── layout/                 # Layout, Sidebar, ArchiveBanner
│   ├── auth/                   # RequireAuth (garde de route)
│   ├── brand/                  # Logo, BrandIcon, BrandWordmark (identité Ekolova)
│   └── evaluations/            # Composants spécifiques aux évaluations
├── styles/                     # Design system SCSS (voir section Styles)
├── utils/
│   └── cn.ts                   # Utilitaire cn() = clsx + tailwind-merge
└── i18n/
    └── locales/               # Fichiers de traduction fr.json, en.json, mg.json
```

**Alias de chemin** : `@/` → `frontend/src/`

---

## Pattern de données — Lecture (CQRS-inspired)

### usePageFetch<T>

Hook central dans `frontend/src/hooks/usePageData.ts`. Gère :
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
| `useElevesNonReinscritsData` | `GET /read/eleves/non-reinscrits` | `eleves` |
| `useMatieresListData` | `GET /read/matieres` | `matieres` |
| `useSallesListData` | `GET /read/salles` | `salles` |
| `usePlanningClasses` | `GET /read/planning/classes` | `planning` |
| `usePlanningClasse` | `GET /read/planning/classes/:id` | `planning` |
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
2. `frontend/src/services/socketService.ts` écoute l'événement
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

React Router v7. `/login` est **publique** ; toutes les autres routes sont enfants d'une route `/` enveloppée par `<RequireAuth>` puis `<Layout>`. `/utilisateurs` ajoute une restriction de rôle. `/` redirige vers `/dashboard` ; toute route inconnue (`*`) redirige aussi vers `/dashboard`.

| Route | Page | Protection |
|-------|------|------------|
| `/login` | Connexion | Publique |
| `/dashboard` | Dashboard | RequireAuth |
| `/classes` | Liste classes | RequireAuth |
| `/classes/nouvelle` | Créer une classe | RequireAuth |
| `/classes/:id/eleves` | Élèves d'une classe | RequireAuth |
| `/classes/:id/planning` | Planning d'une classe | RequireAuth |
| `/eleves` | Liste élèves | RequireAuth |
| `/eleves/nouveau` | Inscrire un élève | RequireAuth |
| `/eleves/:id` | Fiche élève | RequireAuth |
| `/eleves/:id/bulletin` | Bulletin élève | RequireAuth |
| `/matieres` · `/matieres/nouvelle` | Liste / créer matière | RequireAuth |
| `/notes` | Saisie notes | RequireAuth |
| `/planning` | Planning global | RequireAuth |
| `/salles` · `/salles/nouvelle` | Liste / créer salle | RequireAuth |
| `/niveaux` · `/niveaux/nouveau` | Liste / créer niveau | RequireAuth |
| `/professeurs` | Liste professeurs | RequireAuth |
| `/professeurs/affectations` | Affectations professeurs | RequireAuth |
| `/professeurs/:id` | Détail professeur | RequireAuth |
| `/annee-scolaire` | Gestion année scolaire | RequireAuth |
| `/evaluations` | Périodes d'évaluation | RequireAuth |
| `/evaluations/liste` | Liste évaluations | RequireAuth |
| `/evaluations/nouvelle` | Créer une évaluation | RequireAuth |
| `/evaluations/:id` | Détail évaluation | RequireAuth |
| `/parametres` | Paramètres | RequireAuth |
| `/utilisateurs` | Gestion des comptes | RequireAuth `roles={['admin']}` |

---

## Authentification

- **`AuthContext`** (`contexts/AuthContext.tsx`) — monté à la racine, au-dessus d'`AppProviders`. Expose : `user`, `status` (`loading | authenticated | unauthenticated`), `isAuthenticated`, `login`, `logout`, `changePassword`, `hasRole(...)`. Rôles : `admin | professeur | secretaire`.
- **Hydratation** : au démarrage, si un token est présent, appel `GET /auth/me` pour restaurer la session (sinon `unauthenticated`).
- **`RequireAuth`** (`components/auth/RequireAuth.tsx`) — garde de route : redirige vers `/login` si non authentifié, vers `/dashboard` si le rôle ne fait pas partie de `roles`. Affiche un spinner pendant `status === 'loading'`.
- **Stockage du token** : `services/authStorage.ts` (localStorage, clé `auth_token`) — source de vérité unique, lue par l'intercepteur fetch, le service socket et `AuthContext`.
- **Intercepteur** : `services/httpClient.ts` remplace `window.fetch` globalement → ajoute `Authorization: Bearer <token>` à chaque appel API (sans toucher aux ~80 `fetch` existants) et déclenche `onUnauthorized` (→ `logout`) sur une réponse `401`.
- **Connexion / déconnexion** : `login()` stocke le token et l'utilisateur ; `logout()` purge le token et notifie le socket (`notifyAuthChanged`). La déconnexion est déclenchée depuis la `Sidebar` (avec confirmation).

> Contrat API et règles : [bc-auth/_index.md](../../../n2a-domaine/bc-auth/_index.md).

---

## Internationalisation

- Framework : `react-i18next`
- Langues : Français (`fr`), Anglais (`en`), Malagasy (`mg`)
- Fichiers : `frontend/src/i18n/locales/fr.json`, `en.json`, `mg.json`
- Persistance de la langue sélectionnée : IndexedDB via `settingsDB.ts`

---

## Styles — design system SCSS

Le style repose sur un design system **SCSS** (Sass) dans `frontend/src/styles/`, en complément des classes utilitaires **Tailwind v4** (toujours présentes, `cn()` = `clsx` + `tailwind-merge`).

```
styles/
├── index.scss            # Point d'entrée — importe tous les partials
├── _variables.scss       # Variables SCSS (couleurs, radius, typographie, z-index)
├── _themes.scss          # CSS custom properties : mode clair (défaut), mode sombre, couleurs d'accent
├── _mixins.scss · _utilities.scss · _reset.scss
├── components/           # _buttons, _badges, _cards, _forms, _modals, _tables, _alerts, _shared
├── layout/               # _layout, _sidebar
└── pages/                # styles par page (_dashboard, _bulletin, _planning, _settings…)
```

- Le **thème** (clair/sombre) et la **couleur d'accent** sont pilotés par des CSS custom properties (`--primary`, `--bg`, `--text`…) surchargées dynamiquement, persistées via les Paramètres (IndexedDB `settingsDB.ts`).
- La marque Ekolova est rendue par les composants `components/brand/` (logo, wordmark) qui s'adaptent à la couleur primaire du thème.

---

## Build

- `npm run build` (dans `frontend/`) → Vite produit un fichier HTML unique (vite-plugin-singlefile)
- Toutes les dépendances sont inlinées dans le HTML — déployable sans serveur web
