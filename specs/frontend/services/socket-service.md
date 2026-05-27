# Service socketService

**Fichier source :** `src/services/socketService.ts`

Singleton Socket.IO côté client. Gère la connexion, les événements domaine, et les notifications de re-fetch par canal.

---

## Rôle

- Maintenir une seule connexion Socket.IO avec le backend (port 3000)
- Permettre aux hooks d'écouter des changements de données par canal
- Découpler les événements Socket.IO des re-fetches : les services émettent des events domain-specific, le service les convertit en notifications de canal

---

## Type `Channel`

```typescript
type Channel =
  | 'classes' | 'eleves' | 'matieres' | 'notes'
  | 'planning' | 'salles' | 'annees' | 'niveaux'
  | 'professeurs' | 'evaluations' | 'periodes'
  | 'all'
```

Le canal `'all'` est notifié à chaque `notifyDataChange()`, quel que soit le canal source.

---

## Classe interne `SocketService` (singleton)

### Propriétés privées
```typescript
private socket: Socket | null               // connexion Socket.IO
private static instance: SocketService      // instance singleton
private refreshListeners: Map<Channel, Set<Listener>>  // listeners par canal
```

### Méthodes publiques

```typescript
onEvent<T>(event: string, callback: (data: T) => void): () => void
// S'abonne à un événement Socket.IO. Retourne une fonction de désabonnement.

emitEvent(event: string, data?: unknown): void
// Émet un événement vers le serveur.

onDataChange(channel: Channel, listener: Listener): () => void
// Enregistre un listener de re-fetch sur un canal. Retourne cleanup.

notifyDataChange(channel: Channel): void
// Notifie tous les listeners du canal + le canal 'all'.

disconnect(): void
isConnected(): boolean
```

### Connexion
```typescript
// Transport : websocket uniquement (pas de polling HTTP)
io(SOCKET_URL, { transports: ['websocket'], autoConnect: true })
```

---

## API exportée (module-level)

```typescript
export const onEvent = <T>(event, callback) => socketService.onEvent(event, callback)
export const emitEvent = (event, data?) => socketService.emitEvent(event, data)
export const onDataChange = (channel, listener) => socketService.onDataChange(channel, listener)
export const notifyDataChange = (channel) => socketService.notifyDataChange(channel)
export default socketService
export type { Channel }
```

---

## Flux complet de mise à jour temps réel

```
1. Backend: DomainService appelle EventsGateway.server.emit('classe:created', data)
2. Client: socket reçoit 'classe:created'
3. Contexte domaine: onEvent('classe:created', ...) → notifyDataChange('classes')
4. usePageFetch souscrit au canal 'classes': runFetch(silent=true)
5. Page mise à jour sans spinner de chargement
```

---

## Événements Socket.IO connus

| Événement | Canal | Description |
|-----------|-------|-------------|
| `classe:created` | classes | Nouvelle classe créée |
| `classe:updated` | classes | Classe modifiée |
| `eleve:created` | eleves | Nouvel élève |
| `eleve:updated` | eleves | Élève modifié |
| `matiere:created` | matieres | Nouvelle matière |
| `matiere:updated` | matieres | Matière modifiée |
| `note:created` | notes | Note ajoutée |
| `note:updated` | notes | Note modifiée |
| `creneau:created` | planning | Créneau ajouté |
| `creneau:updated` | planning | Créneau modifié |
| `creneau:deleted` | planning | Créneau supprimé |
| `salle:created` | salles | Salle créée |
| `salle:updated` | salles | Salle modifiée |
| `salle:deleted` | salles | Salle supprimée |
| `annee:created` | annees | Année créée |
| `annee:updated` | annees | Année modifiée |
| `evaluation:created` | evaluations | Évaluation créée |
| `evaluation:updated` | evaluations | Évaluation modifiée |
| `evaluation:publie` | evaluations | Évaluation publiée |
| `evaluation:deleted` | evaluations | Évaluation supprimée |
| `periode:updated` | periodes | Période modifiée |
| `professeur:event` | professeurs | Tout changement prof |
| `assignment:event` | professeurs | Changement affectation |

---

## Dépendances

- `socket.io-client` v4.8.x
- `src/config/api.ts` → `SOCKET_URL`
