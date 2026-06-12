import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
