# Architecture Backend

> **Couche** : N3 — COMMENT (backend)
> **Ce fichier contient** : stack technique, structure NestJS, patterns, middleware, WebSocket
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails écrans (→ N2b)

---

## Stack technique

| Technologie | Version | Rôle |
|-------------|---------|------|
| NestJS | — | Framework Node.js (modules, DI, décorateurs) |
| TypeScript | 5 | Typage statique |
| MongoDB | — | Base de données document |
| Mongoose | — | ODM MongoDB |
| @nestjs/mongoose | — | Intégration Mongoose dans NestJS |
| Socket.IO | — | WebSocket temps réel |
| @nestjs/platform-socket.io | — | Gateway WebSocket NestJS |

---

## Configuration

| Variable d'env | Défaut | Rôle |
|----------------|--------|------|
| `MONGO_URI` | `mongodb://localhost:27017/gestion-ecole` | URI de connexion MongoDB |
| `PORT` | `3000` | Port du serveur HTTP |

---

## Structure des modules

```
server/src/
├── app.module.ts              # Module racine — importe tous les modules, configure MongoDB
├── main.ts                    # Bootstrap NestJS + Socket.IO CORS
├── classes/                   # Module Classes
│   ├── classe.schema.ts
│   ├── classes.controller.ts
│   ├── classes.service.ts
│   └── classes.module.ts
├── eleves/                    # Module Élèves
├── matieres/                  # Module Matières
├── notes/                     # Module Notes
├── planning/                  # Module Planning (créneaux)
├── salles/                    # Module Salles
├── annees/                    # Module Années scolaires
├── niveaux/                   # Module Niveaux
├── professeurs/               # Module Professeurs
├── teacher-assignments/       # Module Affectations enseignant
├── periodes/                  # Module Périodes d'évaluation
├── evaluations/               # Module Évaluations
├── suivi/                     # Module Suivi (absences, avertissements, convocations)
├── exclusions/                # Module Exclusions
├── departs/                   # Module Départs
├── read/                      # Module Read — endpoints /read/*
│   ├── read.controller.ts
│   ├── read.service.ts
│   ├── view-builder.service.ts
│   └── schemas/               # Schémas des vues dénormalisées (ReadClasse, ReadEleve…)
├── events/
│   └── events.gateway.ts      # Gateway Socket.IO
├── data/
│   └── seeder.service.ts      # Seeder de données de démo
├── export/                    # Module Export (CSV/XLSX/PDF)
├── migration/                 # Module Migration
└── common/
    └── middleware/
        └── api-logger.middleware.ts
```

---

## Pattern de module domaine

Chaque module domaine suit la même structure :

```
<domaine>/
├── <domaine>.schema.ts       # @Schema Mongoose — définit la collection et les champs
├── <domaine>.controller.ts   # @Controller — endpoints REST, délègue au service
├── <domaine>.service.ts      # @Injectable — logique métier, accès MongoDB
└── <domaine>.module.ts       # @Module — importe les dépendances, exporte le service
```

**Pattern du contrôleur** :
1. Appel service (mutation)
2. Émission événement Socket.IO via `EventsGateway`
3. Mise à jour vue dénormalisée via `ViewBuilderService`
4. Retour du résultat

---

## Module Read — Pattern CQRS côté lecture

### ReadController

Tous les endpoints `GET /read/*` sont dans `ReadController`. Ils retournent des vues dénormalisées pré-calculées optimisées pour chaque page frontend.

### ReadService

Interroge les collections `read-*` (vues matérialisées) ou construit la vue à la volée pour les endpoints qui en ont besoin.

### ViewBuilderService

Maintient les vues dénormalisées dans des collections `read-*` :
- **Collections** : `read-classes`, `read-eleves`, `read-matieres`, `read-notes`, `read-creneaux`, `read-salles`, `read-evaluations`
- **Déclencheurs** : `onClasseWrite`, `onEleveWrite`, `onNoteWrite`, `onCreneauWrite`, `onSalleWrite`, `onMatiereWrite`, `onEvaluationWrite`, `onProfesseurWrite`, `onNiveauWrite`
- **Stratégie** : upsert ciblé sur l'entité modifiée. Si l'ID n'est pas fourni (ex: fusion de créneaux), rebuild complet du sous-ensemble concerné.
- **Change Streams** : en mode Replica Set MongoDB, des Change Streams permettent de détecter automatiquement les changements sans appel explicite aux méthodes `on*Write`.
- **Fallback** : `rebuildAll()` au démarrage du module pour garantir la cohérence.

---

## WebSocket — EventsGateway

Fichier : `server/src/events/events.gateway.ts`

Gateway Socket.IO unique. Les services domaine appellent `events.emit(event, payload)` après chaque mutation.

**Mapping événements → canaux frontend** :

| Événement backend | Canal frontend (`notifyDataChange`) |
|------------------|-------------------------------------|
| `classe:*` | `classes` |
| `eleve:*` | `eleves` |
| `matiere:*` | `matieres` |
| `note:*` | `notes` |
| `creneau:*` | `planning` |
| `salle:*` | `salles` |
| `annee:*` | `annees` |
| `niveau:*` | `niveaux` |
| `professeur:*` | `professeurs` |
| `evaluation:*` | `evaluations` |
| `periode:*` | `periodes` |

---

## Middleware

`ApiLoggerMiddleware` — appliqué à toutes les routes — logue méthode HTTP, URL, durée.

---

## Seeder

`SeederService` s'exécute automatiquement au démarrage si toutes les collections sont vides. Insère :
- 12 salles
- 15 classes
- 15 matières (avec coefficients par niveau)
- ~350 élèves
- ~2 000 notes
- ~200 créneaux

Commande manuelle : `cd server && npm run seed`

---

## Serialisation JSON

Tous les schémas Mongoose utilisent un `toJSON` transform qui :
- Ajoute `id` (copie de `_id`)
- Supprime `_id` et `__v`
- Activé par `{ toJSON: { virtuals: true, transform: toJsonTransform } }`
