import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {
    this.connect();
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private connect(): void {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.log('Socket connection error:', error.message);
    });
  }

  onEvent<T>(event: string, callback: (data: T) => void): () => void {
    if (this.socket) {
      this.socket.on(event, callback);
      return () => {
        this.socket?.off(event, callback);
      };
    }
    return () => {};
  }

  emitEvent(event: string, data?: unknown): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

const socketService = SocketService.getInstance();

export const onEvent = <T>(event: string, callback: (data: T) => void) =>
  socketService.onEvent(event, callback);

export const emitEvent = (event: string, data?: unknown) =>
  socketService.emitEvent(event, data);

export default socketService;
