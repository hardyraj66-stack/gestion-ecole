# Spécifications GestionÉcole

Spécifications complètes de l'application GestionÉcole. Chaque fichier décrit un élément du projet avec suffisamment de détail pour permettre sa reconstruction exacte à partir de zéro.

---

## Structure du dossier

```
specs/
├── README.md                              ← ce fichier (index)
│
├── shared/                                ← éléments transversaux
│   ├── architecture.md                    ← vision globale, patterns, flux de données
│   ├── types.md                           ← tous les types TypeScript (src/types/index.ts)
│   └── routing.md                         ← table des routes React Router
│
├── frontend/
│   ├── pages/                             ← 1 fichier par page (ou groupe de pages liées)
│   │   ├── dashboard.md
│   │   ├── classes-list.md
│   │   ├── classe-eleves.md
│   │   ├── create-classe.md
│   │   ├── eleves-list.md
│   │   ├── create-eleve.md
│   │   ├── eleve-fiche.md
│   │   ├── bulletin.md
│   │   ├── matieres-list.md               ← inclut CreateMatiere
│   │   ├── ajouter-notes.md
│   │   ├── planning.md
│   │   ├── salles-list.md
│   │   ├── niveaux-list.md                ← inclut CreateNiveau
│   │   ├── professeurs.md                 ← ProfesseursList + Detail + Assignments
│   │   ├── annee-scolaire.md
│   │   ├── evaluations.md                 ← Périodes + Liste + Créer + Détail
│   │   └── parametres.md                  ← inclut CreateSalle
│   │
│   ├── components/
│   │   ├── layout.md                      ← Layout, Sidebar, ArchiveBanner
│   │   ├── shared-form.md                 ← Input, Select, Textarea, ColorPicker…
│   │   ├── shared-display.md              ← Button, Badge, Card, Table, Pagination…
│   │   ├── shared-modals.md               ← Modal, ConfirmDialog, DropdownMenu…
│   │   └── ui-blocks.md                   ← PageHeader, StatCard, EmptyState…
│   │
│   ├── hooks/
│   │   ├── use-page-fetch.md              ← usePageFetch + tous les hooks par page
│   │   ├── use-evaluation-data.md
│   │   └── use-periodes-data.md
│   │
│   ├── contexts/
│   │   ├── app-providers.md               ← ordre d'imbrication
│   │   ├── classe-context.md
│   │   ├── eleve-context.md
│   │   ├── planning-context.md
│   │   ├── viewing-context.md             ← mode archive
│   │   ├── settings-context.md            ← thème, couleur, langue
│   │   └── other-contexts.md              ← Matiere, Note, Salle, Annee, Niveau,
│   │                                         Professeur, TeacherAssignment,
│   │                                         Periode, Evaluation
│   │
│   ├── services/
│   │   ├── read-api.md                    ← facade fetch lecture (readApi.ts)
│   │   ├── socket-service.md              ← singleton Socket.IO (socketService.ts)
│   │   └── settings-db.md                 ← IndexedDB persistance (settingsDB.ts)
│   │
│   └── utils/
│       └── helpers.md                     ← helpers.ts + cn.ts
│
└── backend/
    ├── schemas/
    │   ├── classe.md                      ← Classe schema détaillé
    │   ├── eleve.md                       ← Eleve schema détaillé
    │   └── other-schemas.md               ← Matiere, Note, Creneau, Salle,
    │                                         Professeur, AnneeScolaire, Niveau,
    │                                         PeriodeEvaluation, Evaluation,
    │                                         TeacherAssignment, Absence,
    │                                         Avertissement, Convocation,
    │                                         EleveExclu, EleveQuitte,
    │                                         PlanningExecution
    │
    ├── modules/
    │   ├── app-module.md                  ← AppModule + main.ts
    │   ├── classes-module.md              ← Classes (controller + service + module)
    │   ├── eleves-module.md               ← Élèves (controller + service + module)
    │   ├── seeder-module.md               ← SeederService (données initiales)
    │   └── other-modules.md               ← Matieres, Notes, Planning, Salles,
    │                                         Annees, Niveaux, Professeurs,
    │                                         TeacherAssignments, Periodes,
    │                                         Evaluations, Suivi, Exclusions,
    │                                         Departs, Export, Migration,
    │                                         Middleware ApiLogger
    │
    ├── read/
    │   ├── read-controller.md             ← Tous les endpoints GET /read/*
    │   ├── read-service.md                ← Logique de lecture, view-models
    │   └── view-builder.md                ← Maintenance des collections read-*
    │
    └── gateway/
        └── events-gateway.md              ← WebSocket Socket.IO (EventsGateway)
```

---

## Convention de lecture des specs

Chaque spec de **page frontend** contient :
- **Route** — chemin React Router
- **Dossier** — emplacement des fichiers
- **Rôle** — ce que fait la page
- **Composants** — sous-composants du dossier
- **Données requises** — interface de la réponse API et hook utilisé
- **Structure UI** — layout en pseudo-code
- **Interactions** — comportements utilisateur
- **État local** — état React de la page
- **Dépendances** — imports clés

Chaque spec de **composant frontend** contient :
- **Props interface** TypeScript
- **Comportement** — logique interne
- **Structure** — rendu approximatif

Chaque spec **backend** contient :
- **Endpoints HTTP** — méthode, path, query params, body, réponse
- **Logique service** — algorithme, règles métier, effets de bord
- **Événements émis** — Socket.IO events
- **Schéma Mongoose** — champs, types, index, contraintes

---

## Entrées de démarrage rapide pour reconstruction

Pour reconstruire l'application de zéro, lire dans cet ordre :

1. [`shared/architecture.md`](shared/architecture.md) — comprendre les patterns globaux
2. [`shared/types.md`](shared/types.md) — définir tous les types
3. [`shared/routing.md`](shared/routing.md) — structure de navigation
4. [`backend/modules/app-module.md`](backend/modules/app-module.md) — bootstrap backend
5. [`backend/schemas/`](backend/schemas/) — tous les schémas MongoDB
6. [`backend/read/read-controller.md`](backend/read/read-controller.md) — API lecture
7. [`backend/read/read-service.md`](backend/read/read-service.md) — logique de lecture
8. [`backend/gateway/events-gateway.md`](backend/gateway/events-gateway.md) — WebSocket
9. [`frontend/services/`](frontend/services/) — couche API client
10. [`frontend/hooks/use-page-fetch.md`](frontend/hooks/use-page-fetch.md) — hook central
11. [`frontend/contexts/`](frontend/contexts/) — gestion d'état écriture
12. [`frontend/components/`](frontend/components/) — UI primitives
13. [`frontend/pages/`](frontend/pages/) — pages une par une
