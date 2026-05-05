import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway.js';
import { ChatModule } from '../chat/chat.module.js';

@Module({
  imports: [ChatModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class GatewayModule {}
