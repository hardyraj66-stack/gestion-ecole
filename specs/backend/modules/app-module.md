# AppModule — Module racine NestJS

**Fichier source :** `server/src/app.module.ts`

---

## Rôle

Module NestJS racine. Configure la connexion MongoDB et importe tous les modules domaine.

---

## Connexion MongoDB

```typescript
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-ecole'

MongooseModule.forRoot(MONGO_URI)
```

Variable d'environnement `MONGO_URI` surchargeable en production.

---

## Modules importés (ordre d'import)

```
EventsModule          ← WebSocket gateway (importé en premier, exporté vers tous)
SeederModule          ← Seeder auto au démarrage
MigrationModule       ← Scripts de migration

ReadModule            ← Lecture seule /read/*
AnneesModule          ← /annees
ClassesModule         ← /classes
ElevesModule          ← /eleves
MatieresModule        ← /matieres
NotesModule           ← /notes
PlanningModule        ← /planning
SallesModule          ← /salles
SuiviModule           ← /suivi (absences, avertissements, convocations)
ExclusionsModule      ← /exclusions
DepartsModule         ← /departs
NiveauxModule         ← /niveaux
ProfesseursModule     ← /professeurs
TeacherAssignmentsModule ← /teacher-assignments
PlanningExecutionsModule ← /planning-executions
EvaluationsModule     ← /evaluations
PeriodesModule        ← /periodes
ExportModule          ← /export
```

---

## Middleware global

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiLoggerMiddleware).forRoutes('*')
  }
}
```

`ApiLoggerMiddleware` log toutes les requêtes HTTP (méthode, URL, status, durée en ms).

---

## Entrypoint

**Fichier :** `server/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()    // CORS ouvert (tous origins)
  const port = process.env.PORT || 3000
  await app.listen(port)
}
bootstrap()
```
