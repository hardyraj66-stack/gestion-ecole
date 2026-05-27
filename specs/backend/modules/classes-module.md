# Module Classes

**Dossier source :** `server/src/classes/`

---

## Fichiers

| Fichier | Rôle |
|---------|------|
| `classe.schema.ts` | Schéma Mongoose |
| `classes.controller.ts` | Endpoints REST |
| `classes.service.ts` | Logique métier |
| `classes.module.ts` | Module NestJS |

---

## Controller — `ClassesController`

**Préfixe :** `/classes`

### Endpoints

```
POST   /classes
  Body: { nom, niveau, annee_scolaire, capacite, salle, salle_type }
  → ClassesService.create(dto)
  → Émet: classe:created

PATCH  /classes/:id
  Body: Partial<Classe>
  → ClassesService.update(id, dto)
  → Émet: classe:updated

PATCH  /classes/:id/desactiver
  → ClassesService.desactiver(id)
  → Émet: classe:updated
```

---

## Service — `ClassesService`

### create(dto)
1. Crée la classe dans MongoDB
2. `ViewBuilderService.rebuildClasse(id)` — met à jour la vue read
3. `EventsGateway.emit('classe:created', classe)`

### update(id, dto)
1. `findByIdAndUpdate(id, dto, { new: true })`
2. `ViewBuilderService.rebuildClasse(id)`
3. `EventsGateway.emit('classe:updated', classe)`

### desactiver(id)
1. `findByIdAndUpdate(id, { actif: false })`
2. `ViewBuilderService.rebuildClasse(id)`
3. `EventsGateway.emit('classe:updated', classe)`

---

## Module

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Classe', schema: ClasseSchema }]),
    EventsModule,
    ReadModule,
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
```

---

## Dépendances

- `EventsGateway` (via EventsModule)
- `ViewBuilderService` (via ReadModule)
