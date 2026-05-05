import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';
import { MatchingModule } from '../matching/matching.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
  imports: [MatchingModule, NotificationsModule, GatewayModule],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
