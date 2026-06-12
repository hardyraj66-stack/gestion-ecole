import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { onEvent } from '../services/socketService';

interface PresenceEvent {
  userId: string;
  online: boolean;
  sessions: number;
}

/**
 * Présence « en ligne » des comptes (réservé admin).
 *
 * - Charge l'instantané initial via `GET /presence`.
 * - S'abonne à l'événement Socket.IO `presence:changed` pour les mises à jour
 *   temps réel (connexion / déconnexion d'un compte).
 *
 * Les mises à jour sont **idempotentes** (online = sessions > 0), donc l'ordre
 * d'arrivée entre l'instantané et les événements n'a pas d'importance.
 *
 * @returns `isOnline(userId)` et `sessions(userId)` (nombre d'onglets/appareils).
 */
export function usePresence() {
  // userId -> nombre de sessions actives. Absent = hors ligne.
  const [sessionsByUser, setSessionsByUser] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    // 1) Instantané initial.
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/presence`);
        if (!res.ok) return;
        const list: { userId: string; sessions: number }[] = await res.json();
        if (cancelled) return;
        const next: Record<string, number> = {};
        for (const { userId, sessions } of list) {
          if (sessions > 0) next[userId] = sessions;
        }
        setSessionsByUser(next);
      } catch {
        /* présence indisponible → tout le monde apparaît hors ligne, sans erreur bloquante */
      }
    })();

    // 2) Mises à jour temps réel.
    const off = onEvent<PresenceEvent>('presence:changed', ({ userId, online, sessions }) => {
      setSessionsByUser((prev) => {
        const next = { ...prev };
        if (online && sessions > 0) next[userId] = sessions;
        else delete next[userId];
        return next;
      });
    });

    return () => {
      cancelled = true;
      off();
    };
  }, []);

  const isOnline = useCallback(
    (userId: string) => (sessionsByUser[userId] ?? 0) > 0,
    [sessionsByUser],
  );
  const sessions = useCallback(
    (userId: string) => sessionsByUser[userId] ?? 0,
    [sessionsByUser],
  );

  return { isOnline, sessions };
}
