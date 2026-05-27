# Architecture globale — GestionÉcole

## Vue d'ensemble

Application de gestion scolaire full-stack composée de :
- **Frontend** : React 19 + Vite 7 + TypeScript, rendu en SPA
- **Backend** : NestJS + MongoDB (Mongoose), port 3000
- **Temps réel** : Socket.IO (client ↔ serveur)
- **Build** : `vite-plugin-singlefile` produit un HTML autonome unique

---

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend UI | React | 19.x |
| Bundler | Vite | 7.x |
| Routing | React Router | 7.x |
| CSS | Tailwind CSS | 4.x (via @tailwindcss/vite) |
| Temps réel | socket.io-client | 4.8.x |
| i18n | react-i18next | — |
| Build prod | vite-plugin-singlefile | — |
| Backend | NestJS | — |
| ORM | Mongoose | — |
| Base de données | MongoDB | localhost:27017 |
| WebSocket | socket.io (server) | — |

---

## Flux de données — pattern CQRS inspiré

### Lectures (Read)

```
Page/Hook
  └─ usePageFetch(fetcher, archiveExtractor?, channel)
       └─ readApi.xxx(params, anneeLabel?)
            └─ GET /read/xxx
                 └─ ReadService.getXxx()
                      └─ MongoDB (requêtes optimisées, vues dénormalisées)
```

- Toutes les lectures passent par `/read/*`
- `ReadService` retourne des view-models pré-composés (données joinées, pagination)
- Le paramètre `anneeLabel` active le mode archive sur tous les endpoints read

### Écritures (Write)

```
Contexte (ClasseContext, EleveContext, …)
  └─ fetch POST/PATCH/DELETE /domain/xxx
       └─ DomainController.create/update/delete()
            └─ DomainService.create/update/delete()
                 ├─ MongoDB write
                 ├─ EventsGateway.emit(event, data)   ← temps réel
                 └─ ViewBuilderService.rebuild()       ← vues read
```

### Temps réel (Socket.IO)

```
Server: DomainService
  └─ EventsGateway.server.emit('domain:event', payload)

Client: socketService.ts
  └─ onEvent('domain:event', cb)
  └─ notifyDataChange(channel)   ← déclenche re-fetch silencieux
       └─ usePageFetch souscrit via onDataChange(channel)
            └─ runFetch(silent=true)  ← pas de loading spinner
```

---

## Mode archive / consultation

Quand un utilisateur consulte une année scolaire passée (`AnneeScolairePage`) :

1. `ViewingContext.viewAnnee(annee)` charge un snapshot via `GET /read/annees/:id/snapshot`
2. `isViewingArchive = true`, `viewingLabel = annee.label`
3. `usePageFetch` reçoit `viewingLabel` dans le fetcher — tous les appels `/read/*` passent `?anneeLabel=XXXX-XXXX`
4. `ArchiveBanner` s'affiche en haut de page
5. Les contextes d'écriture sont toujours présents mais inutilisables (lecture seule implicite)
6. `ViewingContext.exitView()` remet le mode live

---

## Organisation du code frontend

```
src/
├── App.tsx                  ← routing React Router
├── main.tsx                 ← point d'entrée, init i18n
├── config/api.ts            ← API_BASE_URL, SOCKET_URL
├── types/index.ts           ← tous les types TypeScript
├── utils/
│   ├── cn.ts                ← combinaison clsx + tailwind-merge
│   └── helpers.ts           ← utilitaires purs
├── i18n/
│   ├── index.ts             ← config i18next
│   └── locales/             ← fr.json, en.json, mg.json
├── services/
│   ├── readApi.ts           ← facade fetch lecture
│   ├── socketService.ts     ← singleton Socket.IO
│   └── settingsDB.ts        ← IndexedDB persistance settings
├── contexts/
│   ├── AppProviders.tsx     ← empilement de tous les contextes
│   ├── ViewingContext.tsx   ← mode archive
│   ├── SettingsContext.tsx  ← thème, couleur, langue
│   └── [domaine]Context.tsx ← méthodes d'écriture par domaine
├── hooks/
│   ├── usePageData.ts       ← usePageFetch + hooks par page
│   ├── useEvaluationData.ts
│   └── usePeriodesData.ts
├── components/
│   ├── layout/              ← Layout, Sidebar, ArchiveBanner
│   ├── shared/              ← primitives UI réutilisables
│   ├── ui/                  ← blocs niveau page
│   ├── brand/               ← logo, wordmark
│   └── evaluations/         ← NotesGrid
└── pages/
    └── [PageName]/          ← 1 dossier par page
        ├── PageName.tsx     ← page principale (data + layout)
        └── SubComponent.tsx ← sous-composants de la page
```

---

## Organisation du code backend

```
server/src/
├── main.ts                  ← NestJS bootstrap, port 3000
├── app.module.ts            ← racine, connexion MongoDB, imports modules
├── common/
│   └── api-logger.middleware.ts
├── [domaine]/               ← pattern par module NestJS
│   ├── [domaine].schema.ts
│   ├── [domaine].controller.ts
│   ├── [domaine].service.ts
│   └── [domaine].module.ts
├── read/                    ← module lecture seule
│   ├── read.controller.ts
│   ├── read.service.ts
│   ├── view-builder.service.ts
│   └── schemas/             ← read models (vues dénormalisées)
├── events/                  ← WebSocket gateway
│   ├── events.gateway.ts
│   └── events.module.ts
├── data/                    ← seeder
│   ├── seeder.service.ts
│   └── seeder.module.ts
├── export/                  ← export CSV/XLSX/PDF
├── migration/               ← scripts de migration
└── suivi/                   ← absences, avertissements, convocations
```

---

## Conventions importantes

| Convention | Valeur |
|-----------|--------|
| Port backend | 3000 |
| Port frontend (dev) | auto Vite (5173) |
| MongoDB URI | `mongodb://localhost:27017/gestion-ecole` |
| Alias import frontend | `@/` → `src/` |
| Trimestres | 1, 2, 3 |
| `salle_type: fixe` | salle assignée à la classe, cachée dans le sélecteur de planning |
| `salle_type: variable` | salle choisie créneau par créneau |
| Niveaux | dérivés des données `/read/niveaux`, jamais codés en dur |
| Pagination | `page` + `limit` sur tous les endpoints liste |

---

## Initialisation des données (Seeder)

Au premier démarrage si toutes les collections MongoDB sont vides, `SeederService` insère automatiquement :
- 12 salles
- 15 classes (niveaux 6ème → Terminale)
- 15 matières avec coefficients par niveau
- ~350 élèves
- ~2 000 notes sur 3 trimestres
- ~200 créneaux de planning
- Professeurs et affectations

Le seeder peut aussi être lancé manuellement : `cd server && npm run seed`.
