import { Module, Global } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceController } from './presence.controller';

/**
 * Module de présence. `@Global` pour que `EventsGateway` (dans EventsModule)
 * puisse injecter `PresenceService` sans import explicite.
 */
@Global()
@Module({
  controllers: [PresenceController],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
