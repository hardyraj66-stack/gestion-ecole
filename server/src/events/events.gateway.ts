import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { verifyJwt } from '../auth/jwt.util';
import { JWT_SECRET } from '../auth/auth.constants';
import { PresenceService } from '../presence/presence.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly presence: PresenceService,
    private readonly users: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    // Authentifie la connexion via le token passé dans le handshake.
    const token =
      client.handshake?.auth?.token || client.handshake?.query?.token;
    try {
      if (!token) throw new Error('Token manquant');
      const payload = verifyJwt(String(token), JWT_SECRET);
      // Revérifie le compte en base (parité avec le guard HTTP) : un compte
      // désactivé, archivé ou dont les sessions ont été révoquées ne doit pas
      // pouvoir ouvrir de socket (ni recevoir d'événements temps réel).
      const user = await this.users.findById(payload.sub);
      if (
        !user ||
        !user.actif ||
        (user as any).deleted ||
        (user as any).tokenVersion !== (payload.tv ?? 0)
      ) {
        throw new Error('Compte inactif ou session révoquée');
      }
      const userId = payload.sub;
      // Mémorise l'identité sur le socket pour la retrouver à la déconnexion.
      client.data.userId = userId;
      const { sessions } = this.presence.add(userId, client.id);
      // Diffuse l'état courant. Idempotent côté client (online = sessions > 0) :
      // l'ordre d'arrivée des événements n'a pas d'importance.
      this.server.emit('presence:changed', { userId, online: true, sessions });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (!userId) return; // connexion jamais authentifiée → rien à retirer
    const { sessions } = this.presence.remove(userId, client.id);
    this.server.emit('presence:changed', {
      userId,
      online: sessions > 0,
      sessions,
    });
  }

  emit(event: string, data: any) {
    this.server.emit(event, data);
  }
}
