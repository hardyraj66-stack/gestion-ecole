import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { verifyJwt } from '../auth/jwt.util';
import { JWT_SECRET } from '../auth/auth.constants';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Authentifie la connexion via le token passé dans le handshake.
    const token =
      client.handshake?.auth?.token || client.handshake?.query?.token;
    try {
      if (!token) throw new Error('Token manquant');
      verifyJwt(String(token), JWT_SECRET);
      console.log(`Client connected: ${client.id}`);
    } catch {
      console.log(`Client rejeté (auth invalide): ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emit(event: string, data: any) {
    this.server.emit(event, data);
  }
}
