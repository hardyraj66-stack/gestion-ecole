import { Controller, Get } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { Roles } from '../auth/roles.decorator';

/**
 * Présence « en ligne » des comptes — réservé aux administrateurs.
 * Fournit l'instantané initial ; les mises à jour temps réel passent par
 * l'événement Socket.IO `presence:changed` (voir EventsGateway).
 */
@Controller('presence')
@Roles('admin')
export class PresenceController {
  constructor(private readonly presence: PresenceService) {}

  /** @returns la liste des comptes en ligne : [{ userId, sessions }]. */
  @Get()
  snapshot() {
    return this.presence.snapshot();
  }
}
