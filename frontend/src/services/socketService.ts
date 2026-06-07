import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';
import { getToken } from './authStorage';

type Channel = 'classes' | 'eleves' | 'matieres' | 'notes' | 'planning' | 'salles' | 'annees' | 'niveaux' | 'professeurs' | 'evaluations' | 'periodes' | 'all';
type Listener = () => void;

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;
  private refreshListeners = new Map<Channel, Set<Listener>>();

  private constructor() {
    this.connect();
    this.refreshListeners.set('classes', new Set());
    this.refreshListeners.set('eleves', new Set());
    this.refreshListeners.set('matieres', new Set());
    this.refreshListeners.set('notes', new Set());
    this.refreshListeners.set('planning', new Set());
    this.refreshListeners.set('salles', new Set());
    this.refreshListeners.set('annees', new Set());
    this.refreshListeners.set('niveaux', new Set());
    this.refreshListeners.set('professeurs', new Set());
    this.refreshListeners.set('evaluations', new Set());
    this.refreshListeners.set('periodes', new Set());
    this.refreshListeners.set('all', new Set());
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) SocketService.instance = new SocketService();
    return SocketService.instance;
  }

  private connect(): void {
    // L'objet socket est toujours créé (pour que onEvent puisse s'abonner),
    // mais ne se connecte que si un token est présent. Le serveur rejette
    // toute connexion non authentifiée.
    const token = getToken();
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: !!token,
      auth: { token: token || undefined },
    });
    this.socket.on('connect', () => console.log('Socket connected:', this.socket?.id));
    this.socket.on('disconnect', () => console.log('Socket disconnected'));
    this.socket.on('connect_error', (error) => console.log('Socket connection error:', error.message));
  }

  /** Reconnecte le socket avec le token courant (appelé après login), ou le coupe (logout). */
  refreshAuth(): void {
    if (!this.socket) { this.connect(); return; }
    const token = getToken();
    this.socket.auth = { token: token || undefined };
    if (token) {
      if (this.socket.connected) this.socket.disconnect();
      this.socket.connect();
    } else {
      this.socket.disconnect();
    }
  }

  onEvent<T>(event: string, callback: (data: T) => void): () => void {
    if (this.socket) {
      this.socket.on(event, callback);
      return () => this.socket?.off(event, callback);
    }
    return () => {};
  }

  emitEvent(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  onDataChange(channel: Channel, listener: Listener): () => void {
    const set = this.refreshListeners.get(channel);
    set?.add(listener);
    return () => { set?.delete(listener); };
  }

  notifyDataChange(channel: Channel): void {
    this.refreshListeners.get(channel)?.forEach(fn => fn());
    this.refreshListeners.get('all')?.forEach(fn => fn());
  }

  disconnect(): void {
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

const socketService = SocketService.getInstance();

export const onEvent = <T>(event: string, callback: (data: T) => void) => socketService.onEvent(event, callback);
export const emitEvent = (event: string, data?: unknown) => socketService.emitEvent(event, data);
export const onDataChange = (channel: Channel, listener: Listener) => socketService.onDataChange(channel, listener);
export const notifyDataChange = (channel: Channel) => socketService.notifyDataChange(channel);
/** À appeler après login/logout pour (re)connecter le socket avec le bon token. */
export const notifyAuthChanged = () => socketService.refreshAuth();
export default socketService;
export type { Channel };
