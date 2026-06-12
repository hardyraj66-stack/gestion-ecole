import { Injectable } from '@nestjs/common';

/**
 * Registre en mémoire des présences « en ligne ».
 *
 * Un compte est considéré en ligne tant qu'il a ≥ 1 socket authentifié connecté.
 * Le `Set<socketId>` par utilisateur gère naturellement le multi-onglets/appareils
 * (et sa taille donne le nombre de sessions actives).
 *
 * État volatile : au redémarrage du serveur le registre se vide, puis se
 * reconstruit automatiquement à la reconnexion des clients. (Mono-instance ;
 * un scale horizontal nécessiterait un store partagé type Redis.)
 */
@Injectable()
export class PresenceService {
  private readonly online = new Map<string, Set<string>>();

  /**
   * Enregistre une session (socket) pour un utilisateur.
   * @returns le nombre de sessions actives et si l'utilisateur vient de passer en ligne (0 → 1).
   */
  add(userId: string, socketId: string): { sessions: number; transitioned: boolean } {
    let set = this.online.get(userId);
    const wasOffline = !set || set.size === 0;
    if (!set) {
      set = new Set();
      this.online.set(userId, set);
    }
    set.add(socketId);
    return { sessions: set.size, transitioned: wasOffline };
  }

  /**
   * Retire une session (socket) pour un utilisateur.
   * @returns le nombre de sessions restantes et si l'utilisateur vient de passer hors ligne (→ 0).
   */
  remove(userId: string, socketId: string): { sessions: number; transitioned: boolean } {
    const set = this.online.get(userId);
    if (!set) return { sessions: 0, transitioned: false };
    set.delete(socketId);
    const sessions = set.size;
    if (sessions === 0) this.online.delete(userId); // purge → pas de fuite mémoire
    return { sessions, transitioned: sessions === 0 };
  }

  isOnline(userId: string): boolean {
    return (this.online.get(userId)?.size ?? 0) > 0;
  }

  sessions(userId: string): number {
    return this.online.get(userId)?.size ?? 0;
  }

  /** Instantané de tous les comptes en ligne — pour le chargement initial (REST). */
  snapshot(): { userId: string; sessions: number }[] {
    return Array.from(this.online.entries()).map(([userId, set]) => ({
      userId,
      sessions: set.size,
    }));
  }
}
