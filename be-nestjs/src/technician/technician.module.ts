import { Module } from '@nestjs/common';
import { TechnicianController } from './technician.controller.js';
import { TechnicianService } from './technician.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
  imports: [NotificationsModule, GatewayModule],
  controllers: [TechnicianController],
  providers: [TechnicianService],
  exports: [TechnicianService],
})
export class TechnicianModule {}
