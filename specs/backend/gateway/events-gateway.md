# EventsGateway — WebSocket

**Fichier source :** `server/src/events/events.gateway.ts`
**Module :** `server/src/events/events.module.ts`

Gateway Socket.IO unique de l'application. Gère toutes les connexions temps réel.

---

## Configuration NestJS

```typescript
@WebSocketGateway({
  cors: { origin: '*' },        // CORS ouvert (dev)
  transports: ['websocket'],    // pas de polling HTTP
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server                // instance Socket.IO server
}
```

---

## Accès depuis les services

Les services de domaine injectent `EventsGateway` et appellent directement `this.eventsGateway.server.emit(...)` :

```typescript
// Dans ClassesService:
constructor(
  private readonly eventsGateway: EventsGateway,
  ...
) {}

async create(dto: CreateClasseDto) {
  const classe = await this.classeModel.create(dto)
  this.eventsGateway.server.emit('classe:created', classe)
  return classe
}
```

---

## Cycle de vie

```typescript
handleConnection(client: Socket): void
// Log: "Client connected: [socketId]"

handleDisconnect(client: Socket): void
// Log: "Client disconnected: [socketId]"
```

---

## Événements émis (server → all clients)

### Domaine Classes
| Événement | Payload | Déclenché par |
|-----------|---------|---------------|
| `classe:created` | Classe | ClassesService.create |
| `classe:updated` | Classe | ClassesService.update |

### Domaine Élèves
| Événement | Payload | Déclenché par |
|-----------|---------|---------------|
| `eleve:created` | Eleve | ElevesService.create |
| `eleve:updated` | Eleve | ElevesService.update, setStatut |

### Domaine Matières
| Événement | Payload |
|-----------|---------|
| `matiere:created` | Matiere |
| `matiere:updated` | Matiere |

### Domaine Notes
| Événement | Payload |
|-----------|---------|
| `note:created` | Note |
| `note:updated` | Note |

### Domaine Planning
| Événement | Payload |
|-----------|---------|
| `creneau:created` | Creneau |
| `creneau:updated` | Creneau |
| `creneau:deleted` | `{ id: string }` |

### Domaine Salles
| Événement | Payload |
|-----------|---------|
| `salle:created` | Salle |
| `salle:updated` | Salle |
| `salle:deleted` | `{ id: string }` |

### Domaine Années
| Événement | Payload |
|-----------|---------|
| `annee:created` | AnneeScolaire |
| `annee:updated` | AnneeScolaire |
| `annee:deleted` | `{ id: string }` |

### Domaine Évaluations
| Événement | Payload |
|-----------|---------|
| `evaluation:created` | Evaluation |
| `evaluation:updated` | Evaluation |
| `evaluation:publie` | Evaluation |
| `evaluation:deleted` | `{ id: string }` |

### Domaine Périodes
| Événement | Payload |
|-----------|---------|
| `periode:updated` | PeriodeEvaluation |

### Domaine Professeurs
| Événement | Payload |
|-----------|---------|
| `professeur:event` | Professeur |
| `assignment:event` | TeacherAssignment |

### Domaine Niveaux
| Événement | Payload |
|-----------|---------|
| `niveau:created` | Niveau |
| `niveau:updated` | Niveau |
| `niveau:deleted` | `{ id: string }` |

---

## Module

```typescript
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway],    // exporté pour injection dans les services domaine
})
export class EventsModule {}
```

`EventsModule` est importé dans chaque module domaine qui a besoin d'émettre des événements.

---

## Côté client (rappel)

Le `socketService.ts` frontend écoute ces événements et appelle `notifyDataChange(channel)` pour déclencher des re-fetches silencieux dans `usePageFetch`.
